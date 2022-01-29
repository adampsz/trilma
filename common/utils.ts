export function assume(value: unknown): asserts value {
  if (!value) throw new Error('Assertion failed');
}

export function unreachable(value: never): never {
  throw new Error(`Entered unreachable code with ${JSON.stringify(value)}`);
}
