#!/usr/bin/env node
import { Command } from 'commander';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import ora from 'ora';
import { createEbook } from './ebook/createEbook';
import { DepthLevel, ProgressEvent } from './ebook/types';

dotenv.config();

const program = new Command();

program
  .name('ai-ebook-creator')
  .description('Generate complete eBooks with AI — from topic to PDF')
  .version('1.0.0');

program
  .argument('<topic>', 'The topic or subject for the eBook')
  .option('-l, --language <lang>', 'Language for the eBook (e.g. "pt-BR", "en-US")', 'en-US')
  .option('-c, --chapters <n>', 'Number of chapters', '8')
  .option(
    '-d, --depth <level>',
    'Depth level: basic | intermediate | advanced',
    'intermediate',
  )
  .action(async (topic: string, options: { language: string; chapters: string; depth: string }) => {
    console.log('');
    console.log(chalk.bold.magenta('  ╔══════════════════════════════════════╗'));
    console.log(chalk.bold.magenta('  ║      AI eBook Creator  v1.0.0        ║'));
    console.log(chalk.bold.magenta('  ╚══════════════════════════════════════╝'));
    console.log('');
    console.log(chalk.cyan(`  Topic:    `) + chalk.white.bold(topic));
    console.log(chalk.cyan(`  Language: `) + chalk.white(options.language));
    console.log(chalk.cyan(`  Chapters: `) + chalk.white(options.chapters));
    console.log(chalk.cyan(`  Depth:    `) + chalk.white(options.depth));
    console.log('');

    const spinner = ora({ text: 'Starting…', color: 'magenta' }).start();

    try {
      const result = await createEbook(
        {
          topic,
          language: options.language,
          chaptersCount: parseInt(options.chapters, 10),
          depthLevel: options.depth as DepthLevel,
        },
        (event: ProgressEvent) => {
          const bar = progressBar(event.progress);
          spinner.text = `${bar} ${chalk.gray(`[${event.progress}%]`)} ${event.message}`;

          if (event.step === 'error') {
            spinner.fail(chalk.red(event.message));
          }
        },
      );

      spinner.succeed(chalk.green.bold('eBook generated successfully!'));
      console.log('');
      console.log(chalk.bold('  Output files:'));
      console.log(chalk.green(`  📄 Markdown: `) + chalk.white(result.mdPath));
      if (result.pdfPath) {
        console.log(chalk.green(`  📕 PDF:      `) + chalk.white(result.pdfPath));
      }
      console.log('');
    } catch (err) {
      spinner.fail(chalk.red('Failed to generate eBook'));
      console.error(chalk.red((err as Error).message));
      process.exit(1);
    }
  });

program.parse();

function progressBar(pct: number): string {
  const filled = Math.floor(pct / 5);
  const empty = 20 - filled;
  return chalk.magenta('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
}
