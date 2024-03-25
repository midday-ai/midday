const fs = require('fs');
const path = require('path');
const { parse } = require('@typescript-eslint/parser');

const pkgImportPath = process.env['PKG_IMPORT_PATH'] ?? '@midday/engine-sdk/'

const distDir =
  process.env['DIST_PATH'] ?
    path.resolve(process.env['DIST_PATH'])
  : path.resolve(__dirname, '..', 'dist');
const distSrcDir = path.join(distDir, 'src');

/**
 * Quick and dirty AST traversal
 */
function traverse(node, visitor) {
  if (!node || typeof node.type !== 'string') return;
  visitor.node?.(node);
  visitor[node.type]?.(node);
  for (const key in node) {
    const value = node[key];
    if (Array.isArray(value)) {
      for (const elem of value) traverse(elem, visitor);
    } else if (value instanceof Object) {
      traverse(value, visitor);
    }
  }
}

/**
 * Helper method for replacing arbitrary ranges of text in input code.
 *
 * The `replacer` is a function that will be called with a mini-api.  For example:
 *
 * replaceRanges('foobar', ({ replace }) => replace([0, 3], 'baz')) // 'bazbar'
 *
 * The replaced ranges must not be overlapping.
 */
function replaceRanges(code, replacer) {
  const replacements = [];
  replacer({ replace: (range, replacement) => replacements.push({ range, replacement }) });

  if (!replacements.length) return code;
  replacements.sort((a, b) => a.range[0] - b.range[0]);
  const overlapIndex = replacements.findIndex(
    (r, index) => index > 0 && replacements[index - 1].range[1] > r.range[0],
  );
  if (overlapIndex >= 0) {
    throw new Error(
      `replacements overlap: ${JSON.stringify(replacements[overlapIndex - 1])} and ${JSON.stringify(
        replacements[overlapIndex],
      )}`,
    );
  }

  const parts = [];
  let end = 0;
  for (const {
    range: [from, to],
    replacement,
  } of replacements) {
    if (from > end) parts.push(code.substring(end, from));
    parts.push(replacement);
    end = to;
  }
  if (end < code.length) parts.push(code.substring(end));
  return parts.join('');
}

/**
 * Like calling .map(), where the iteratee is called on the path in every import or export from statement.
 * @returns the transformed code
 */
function mapModulePaths(code, iteratee) {
  const ast = parse(code, { range: true });
  return replaceRanges(code, ({ replace }) =>
    traverse(ast, {
      node(node) {
        switch (node.type) {
          case 'ImportDeclaration':
          case 'ExportNamedDeclaration':
          case 'ExportAllDeclaration':
          case 'ImportExpression':
            if (node.source) {
              const { range, value } = node.source;
              const transformed = iteratee(value);
              if (transformed !== value) {
                replace(range, JSON.stringify(transformed));
              }
            }
        }
      },
    }),
  );
}

async function* walk(dir) {
  for await (const d of await fs.promises.opendir(dir)) {
    const entry = path.join(dir, d.name);
    if (d.isDirectory()) yield* walk(entry);
    else if (d.isFile()) yield entry;
  }
}

async function postprocess() {
  for await (const file of walk(path.resolve(__dirname, '..', 'dist'))) {
    if (!/\.([cm]?js|(\.d)?[cm]?ts)$/.test(file)) continue;

    const code = await fs.promises.readFile(file, 'utf8');

    let transformed = mapModulePaths(code, (importPath) => {
      if (file.startsWith(distSrcDir)) {
        if (importPath.startsWith(pkgImportPath)) {
          // convert self-references in dist/src to relative paths
          let relativePath = path.relative(
            path.dirname(file),
            path.join(distSrcDir, importPath.substring(pkgImportPath.length)),
          );
          if (!relativePath.startsWith('.')) relativePath = `./${relativePath}`;
          return relativePath;
        }
        return importPath;
      }
      if (importPath.startsWith('.')) {
        // add explicit file extensions to relative imports
        const { dir, name } = path.parse(importPath);
        const ext = /\.mjs$/.test(file) ? '.mjs' : '.js';
        return `${dir}/${name}${ext}`;
      }
      return importPath;
    });

    if (file.startsWith(distSrcDir) && !file.endsWith('_shims/index.d.ts')) {
      // strip out `unknown extends Foo ? never :` shim guards in dist/src
      // to prevent errors from appearing in Go To Source
      transformed = transformed.replace(
        new RegExp('unknown extends (typeof )?\\S+ \\? \\S+ :\\s*'.replace(/\s+/, '\\s+'), 'gm'),
        // replace with same number of characters to avoid breaking source maps
        (match) => ' '.repeat(match.length),
      );
    }

    if (file.endsWith('.d.ts')) {
      // work around bad tsc behavior
      // if we have `import { type Readable } from '@midday/engine-sdk/_shims/index'`,
      // tsc sometimes replaces `Readable` with `import("stream").Readable` inline
      // in the output .d.ts
      transformed = transformed.replace(/import\("stream"\).Readable/g, 'Readable');
    }

    // strip out lib="dom" and types="node" references; these are needed at build time,
    // but would pollute the user's TS environment
    transformed = transformed.replace(
      /^ *\/\/\/ *<reference +(lib="dom"|types="node").*?\n/gm,
      // replace with same number of characters to avoid breaking source maps
      (match) => ' '.repeat(match.length - 1) + '\n',
    );

    if (transformed !== code) {
      await fs.promises.writeFile(file, transformed, 'utf8');
      console.error(`wrote ${path.relative(process.cwd(), file)}`);
    }
  }
}
postprocess();
