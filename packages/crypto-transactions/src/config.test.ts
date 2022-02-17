import "jest-extended";

import { createConfig } from "../test";
import { devnet, mainnet } from "../test/networks";

let subject;
beforeEach(() => (subject = createConfig("devnet")));

describe("Configuration", () => {
    it("should be instantiated", () => {
        expect(subject).toBeObject();
    });

    it('key should be "set"', () => {
        subject.set("key", "value");

        expect(subject.get("key")).toBe("value");
    });

    it('key should be "get"', () => {
        expect(subject.get("network.nethash")).toBe("2a44f340d76ffc3df204c5f38cd355b7496c9065a1ade2ef92071436bd72e867");
    });

    it("should build milestones", () => {
        expect(subject.getMilestones()).toEqual(devnet.milestones);
    });

    it('should build milestones without concatenating the "minimumVersions" array', () => {
        const milestones = devnet.milestones.sort((a, b) => a.height - b.height);
        subject.setHeight(milestones[0].height);

        const lastMilestone = milestones.find((milestone) => !!milestone.p2p && !!milestone.p2p.minimumVersions);

        if (lastMilestone && lastMilestone.p2p && subject.getMilestone().p2p) {
            expect(subject.getMilestone().p2p.minimumVersions).toEqual(lastMilestone.p2p.minimumVersions);
        }
    });

    it("should get milestone for height", () => {
        expect(subject.getMilestone(21600)).toEqual(devnet.milestones[2]);
    });

    it("should get milestone for this.height if height is not provided as parameter", () => {
        subject.setHeight(21600);

        expect(subject.getMilestone()).toEqual(devnet.milestones[2]);
    });

    it("should set the height", () => {
        subject.setHeight(21600);

        expect(subject.getHeight()).toEqual(21600);
    });

    it("should determine if a new milestone is becoming active", () => {
        for (const milestone of devnet.milestones) {
            subject.setHeight(milestone.height);
            expect(subject.isNewMilestone()).toBeTrue();
        }

        subject.setHeight(999999);
        expect(subject.isNewMilestone()).toBeFalse();

        subject.setHeight(1);
        expect(subject.isNewMilestone(999999)).toBeFalse();
    });

    describe("getNextMilestoneByKey", () => {
        it("should throw an error if no milestones are set", () => {
            subject = createConfig("devnet", { milestones: [] });
            expect(() => subject.getNextMilestoneWithNewKey(1, "blocktime")).toThrow(
                `Attempted to get next milestone but none were set`,
            );
        });

        it("should get the next milestone with a given key", () => {
            subject = createConfig("devnet");
            const expected = {
                found: true,
                height: 1750000,
                data: 255,
            };
            expect(subject.getNextMilestoneWithNewKey(1, "vendorFieldLength")).toEqual(expected);
        });

        it("should return empty result if no next milestone is found", () => {
            subject = createConfig("devnet");
            const expected = {
                found: false,
                height: 1750000,
                data: null,
            };
            expect(subject.getNextMilestoneWithNewKey(1750000, "vendorFieldLength")).toEqual(expected);
        });

        it("should get all milestones", () => {
            const milestones = [
                { height: 1, blocktime: 8 },
                { height: 3, blocktime: 9 },
                { height: 6, blocktime: 10 },
                { height: 8, blocktime: 8 },
            ];
            subject = createConfig("devnet", { milestones });
            const secondMilestone = {
                found: true,
                height: 3,
                data: 9,
            };
            const thirdMilestone = {
                found: true,
                height: 6,
                data: 10,
            };
            const fourthMilestone = {
                found: true,
                height: 8,
                data: 8,
            };
            const emptyMilestone = {
                found: false,
                height: 8,
                data: null,
            };
            expect(subject.getNextMilestoneWithNewKey(1, "blocktime")).toEqual(secondMilestone);
            expect(subject.getNextMilestoneWithNewKey(3, "blocktime")).toEqual(thirdMilestone);
            expect(subject.getNextMilestoneWithNewKey(4, "blocktime")).toEqual(thirdMilestone);
            expect(subject.getNextMilestoneWithNewKey(6, "blocktime")).toEqual(fourthMilestone);
            expect(subject.getNextMilestoneWithNewKey(8, "blocktime")).toEqual(emptyMilestone);
        });
    });
});
