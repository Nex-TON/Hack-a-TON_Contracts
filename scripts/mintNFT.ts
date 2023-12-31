import { Address, toNano } from 'ton-core';
import { NftCollection } from '../wrappers/NftCollection';
import { NetworkProvider, sleep } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse(args.length > 0 ? args[0] : await ui.input('Collection address'));
    

    const nftCollection = provider.open(NftCollection.createFromAddress(address));

    await nftCollection.sendMintNft(provider.sender(),{
        value: toNano("0.02"),
        amount: toNano("0.055"),
        itemIndex: 0,
        itemOwnerAddress: provider.sender().address as Address,
        itemContent: "123",
        queryId: Date.now()
    })
    ui.write('NFT Item deployed');
}