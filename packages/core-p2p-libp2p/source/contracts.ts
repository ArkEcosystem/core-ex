export const PubSubHandler = {
	GetBlocks: "libp2p.pubsub<GetBlocks>",
	GetCommonBlocks: "libp2p.pubsub<GetCommonBlocks>",
	GetPeerStatus: "libp2p.pubsub<GetPeerStatus>",
	PostBlock: "libp2p.pubsub<PostBlock>",
	PostTransactions: "libp2p.pubsub<PostTransactions>",
};

export interface IMessage {
	receivedFrom: string;
	data: Uint8Array;
	topicIDs: string[];
	from: string;
	seqno: Buffer;
	signature: Buffer;
	key: Buffer;
}
