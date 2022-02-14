import yargs from "yargs-parser";

/**
 * @export
 * @class InputParser
 */
export class InputParser {
    /**
     * @static
     * @param {string[]} args
     * @returns
     * @memberof InputParser
     */
    public static parseArgv(args: string[]) {
        const parsed: yargs.Arguments = yargs(args, { count: ["v"] });

        const argv: string[] = parsed._;

        parsed._.splice(0, parsed._.length);

        return { args: argv, flags: parsed };
    }
}
