/**
 *  Here, the Result type is still a generic type that takes in a type T that extends the Actions
 *  type. It uses a mapped type to iterate over the keys of the T object and create a string literal
 *  union of all the possible combinations of resourceId:action strings. The [keyof T] at the end of
 *  the type definition means that the resulting type is a union of all the possible string literal
 *  unions created by the mapped type.
 *
 *  In the example, we define a new MyActions type that matches the Actions type from the original
 *  question, and then use the Result type to transform it into the desired MyResult type. The
 *  resulting type is:
 *  "team.read" | "team.write" | "domain.dns.read_record" | "domain.dns.create_record"
 *
 *
 *
 * @example
 * type Resources = {
 *   team: 'read' | 'write';
 *   domain: {
 *     dns: "read_record" | "create_record"
 *   }
 * };
 *
 * type MyResult = Flatten<Resources>; // type MyResult = "team.read" | "team.write" | "domain.dns.read_record" | "domain.dns.create_record"
 *
 * You can also choose a custom delimiter:
 * @example
 * Flatten<Resources, "::">
 */
export type Flatten<
  T extends Record<string, unknown>,
  Delimiter extends string = ".",
> = {
  [K in keyof T]: T[K] extends Record<string, unknown>
    ? `${string & K}${Delimiter}${T[K] extends infer U
        ? U extends Record<string, unknown>
          ? Flatten<U, Delimiter>
          : string & U
        : never}`
    : `${string & K}${Delimiter}${string & T[K]}`;
}[keyof T];
