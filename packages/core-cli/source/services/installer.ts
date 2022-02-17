import { sync } from "execa";
import { rcompare,satisfies } from "semver";

import { injectable } from "../ioc";

@injectable()
export class Installer {
	public install(pkg: string, tag = "latest"): void {
		this.installPeerDependencies(pkg, tag);

		const { stdout, stderr, exitCode } = sync(`yarn global add ${pkg}@${tag} --force`, { shell: true });

		if (exitCode !== 0) {
			throw new Error(`"yarn global add ${pkg}@${tag} --force" exited with code ${exitCode}\n${stderr}`);
		}

		console.log(stdout);
	}

	public installPeerDependencies(pkg: string, tag = "latest"): void {
		const { stdout, stderr, exitCode } = sync(`yarn info ${pkg}@${tag} peerDependencies --json`, { shell: true });

		if (exitCode !== 0) {
			throw new Error(
				`"yarn info ${pkg}@${tag} peerDependencies --json" exited with code ${exitCode}\n${stderr}`,
			);
		}

		for (const [peerPkg, peerPkgSemver] of Object.entries(JSON.parse(stdout).data ?? {})) {
			this.installRangeLatest(peerPkg, peerPkgSemver as string);
		}
	}

	public installRangeLatest(pkg: string, range: string): void {
		const { stdout, stderr, exitCode } = sync(`yarn info ${pkg} versions --json`, { shell: true });

		if (exitCode !== 0) {
			throw new Error(`"yarn info ${pkg} versions --json" exited with code ${exitCode}\n${stderr}`);
		}

		const versions = (JSON.parse(stdout).data as string[])
			.filter((v) => satisfies(v, range))
			.sort((a, b) => rcompare(a, b));

		if (versions.length === 0) {
			throw new Error(`No ${pkg} version to satisfy ${range}`);
		}

		this.install(pkg, versions[0]);
	}
}
