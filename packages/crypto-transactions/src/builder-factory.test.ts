import "jest-extended";

import { createServices } from "../test";
import { TransactionBuilderFactory } from "./builder-factory";
import { DelegateRegistrationBuilder } from "./builders/delegate-registration";
import { DelegateResignationBuilder } from "./builders/delegate-resignation";
import { IPFSBuilder } from "./builders/ipfs";
import { MultiPaymentBuilder } from "./builders/multi-payment";
import { MultiSignatureBuilder } from "./builders/multi-signature";
import { SecondSignatureBuilder } from "./builders/second-signature";
import { TransferBuilder } from "./builders/transfer";
import { VoteBuilder } from "./builders/vote";

let subject: TransactionBuilderFactory;
beforeAll(() => (subject = new TransactionBuilderFactory(createServices("devnet"))));

describe("Builder Factory", () => {
    it("should create DelegateRegistrationBuilder", () => {
        expect(subject.delegateRegistration()).toBeInstanceOf(DelegateRegistrationBuilder);
    });

    it("should create DelegateResignationBuilder", () => {
        expect(subject.delegateResignation()).toBeInstanceOf(DelegateResignationBuilder);
    });

    it("should create IPFSBuilder", () => {
        expect(subject.ipfs()).toBeInstanceOf(IPFSBuilder);
    });

    it("should create MultiPaymentBuilder", () => {
        expect(subject.multiPayment()).toBeInstanceOf(MultiPaymentBuilder);
    });

    it("should create MultiSignatureBuilder", () => {
        expect(subject.multiSignature()).toBeInstanceOf(MultiSignatureBuilder);
    });

    it("should create SecondSignatureBuilder", () => {
        expect(subject.secondSignature()).toBeInstanceOf(SecondSignatureBuilder);
    });

    it("should create TransferBuilder", () => {
        expect(subject.transfer()).toBeInstanceOf(TransferBuilder);
    });

    it("should create VoteBuilder", () => {
        expect(subject.vote()).toBeInstanceOf(VoteBuilder);
    });
});
