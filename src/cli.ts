export async function run(argv: readonly string[]): Promise<void> {
  const [command, ...args] = argv;

  if (!command || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  if (command === '--version' || command === '-v') {
    process.stdout.write('jobber-cli v3.0.0-alpha.0\n');
    return;
  }

  // Command registry wired in Phase 4.
  throw new Error(
    `Unknown command: ${command}. Command registry not yet implemented (Phase 4). Args: ${args.join(' ')}`,
  );
}

function printHelp(): void {
  process.stdout.write(
    [
      'jobber-cli v3.0.0-alpha.0',
      '',
      'Usage: jobber <command> [args...]',
      '',
      'Commands will be registered in Phase 4.',
      '',
    ].join('\n'),
  );
}
