/**
 * Stringified UUIDv4.
 * See [RFC 4112](https://tools.ietf.org/html/rfc4122)
 * @pattern /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
 * @title UUID
 * @format uuid
 * @example "52907745-7672-470e-a803-a2f8feb52944"
 * @message UUID must be a valid UUID
 */
export type UUID = string;