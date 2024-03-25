import fs from 'fs';
import { toFile, type ResponseLike } from 'midday/uploads';
import { File } from 'midday/_shims/index';

class MyClass {
  name: string = 'foo';
}

function mockResponse({ url, content }: { url: string; content?: Blob }): ResponseLike {
  return {
    url,
    blob: async () => content as any,
  };
}

describe('toFile', () => {
  it('throws a helpful error for mismatched types', async () => {
    await expect(
      // @ts-expect-error intentionally mismatched type
      toFile({ foo: 'string' }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Unexpected data type: object; constructor: Object; props: ["foo"]"`,
    );

    await expect(
      // @ts-expect-error intentionally mismatched type
      toFile(new MyClass()),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Unexpected data type: object; constructor: MyClass; props: ["name"]"`,
    );
  });

  it('disallows string at the type-level', async () => {
    // @ts-expect-error we intentionally do not type support for `string`
    // to help people avoid passing a file path
    const file = await toFile('contents');
    expect(file.text()).resolves.toEqual('contents');
  });

  it('extracts a file name from a Response', async () => {
    const response = mockResponse({ url: 'https://example.com/my/audio.mp3' });
    const file = await toFile(response);
    expect(file.name).toEqual('audio.mp3');
  });

  it('extracts a file name from a File', async () => {
    const input = new File(['foo'], 'input.jsonl');
    const file = await toFile(input);
    expect(file.name).toEqual('input.jsonl');
  });

  it('extracts a file name from a ReadStream', async () => {
    const input = fs.createReadStream('tests/uploads.test.ts');
    const file = await toFile(input);
    expect(file.name).toEqual('uploads.test.ts');
  });
});
