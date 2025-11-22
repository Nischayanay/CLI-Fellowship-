import chalk from 'chalk';

export const logger = {
    info: (msg: string) => console.log(chalk.blue('ℹ') + ' ' + msg),
    success: (msg: string) => console.log(chalk.green('✔') + ' ' + msg),
    warning: (msg: string) => console.log(chalk.yellow('⚠') + ' ' + msg),
    error: (msg: string) => console.error(chalk.red('✖') + ' ' + msg),
    dim: (msg: string) => console.log(chalk.dim(msg)),
    log: (msg: string) => console.log(msg),
};
