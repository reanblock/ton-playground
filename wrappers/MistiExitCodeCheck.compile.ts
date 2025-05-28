import { CompilerConfig } from '@ton/blueprint';

export const compile: CompilerConfig = {
    lang: 'tact',
    target: 'contracts/misti_exit_code_check.tact',
    options: {
        debug: true,
    },
};
