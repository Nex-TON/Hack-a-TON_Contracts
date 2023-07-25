import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { Address, toNano, fromNano, Cell, beginCell } from 'ton-core';
import { NexTon } from '../wrappers/NexTon';
import { NftCollection } from '../wrappers/NftCollection';
import '@ton-community/test-utils';
import { randomAddress } from '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe('NexTon', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('NftCollection');
    });

    let blockchain: Blockchain;
    let nexton: SandboxContract<NexTon>;
    let nftCollection: SandboxContract<NftCollection>;
    let deployer: SandboxContract<TreasuryContract>;

    let myAddress: Address = Address.parse("kQAXUIBw-EDVtnCxd65Z2M21KTDr07RoBL6BYf-TBCd6dTBu");
    
    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');

        nftCollection = blockchain.openContract(await NftCollection.createFromConfig({
            ownerAddress: deployer.address,
            nextItemIndex: 0,
            collectionContent: beginCell().storeUint(58594,256).endCell(),
            nftItemCode: await compile("NftItem"),
            royaltyParams: {
                royaltyFactor: 15,
                royaltyBase: 100,
                royaltyAddress: deployer.address
            }
        }, code))
        
        nexton = blockchain.openContract(await NexTon.fromInit(myAddress, randomAddress(0)));

        const nextonDeployResult = await nexton.send(
            deployer.getSender(),
            {
                value: toNano('0.1'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(nextonDeployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: nexton.address,
            deploy: true,
            success: true,
        });

        const owner = await nexton.getOwner();
        expect(owner.equals( deployer.address)).toBe(true);
        
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and invicore are ready to use
    });

    it('Should change Staking Pool address', async() => {
        console.log("Changing Address!!!")
        const user = await blockchain.treasury('user');
        const addressBefore = await nexton.getStakingPool();
        console.log("Address before: ", addressBefore);

        const userMessage = await nexton.send(
            user.getSender(), 
            {
            value: toNano("0.2")
            }, 
            {   
                $$type: 'ChangeAddr',
                address: await randomAddress(),
                entity: "SP"
            }
        )
        //console.log("user message", userMessage.events); // should be bounced

        const addressAfterUser = await nexton.getStakingPool();
        console.log("Address after (user): ", addressAfterUser);

        const deployerMessage = await nexton.send(
            deployer.getSender(),
            {
                value: toNano("0.2")
            }, 
            {   
                $$type: 'ChangeAddr',
                address: await randomAddress(0),
                entity: "SP"
            }
        )
        //console.log("Deployer message", deployerMessage.events);
        
        const addressAfterDeployer = await nexton.getStakingPool();
        console.log("Address after (deployer): ", addressAfterDeployer);
        expect(addressAfterDeployer.toString()).not.toEqual(addressBefore.toString());
        expect(addressAfterUser.toString()).toEqual(addressBefore.toString());
    });

    it('Deposit and Mint NFT', async() => {
        console.log("Depositing!!!");
        const user = await blockchain.treasury('user');
        const balanceBefore = await nexton.getBalance();

        console.log("Balance before deposit: ", fromNano(balanceBefore));
        const userMessage = await nexton.send(
            user.getSender(), 
            {
            value: toNano("10000")
            }, 
            {   
                $$type: 'UserDeposit',
                lockPeriod: 600n,
                leverage: 5n
            }
        )

        console.log(userMessage.events);

        console.log("Balance after: ", fromNano(await nexton.getBalance()) )


    });
});