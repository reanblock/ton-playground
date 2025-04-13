# TON Playground

Play carefully! Used to test TON smart contracts in FunC and Tact for security vulnerabilties.

- To create a new contract run `npx blueprint create ContractName` and you can choose FunC or Tact in the wizard.
- To run a specific test run `npx blueprint test ContractName` 
- To build a specific contract run `npx blueprint build ContractName`

**NOTE** it appears the Tact contracts need to be manually built after changing the code and before running the test.

## TODO

- `raw_reserve`
- Simple Messages
- Complex Messages
- Gas monitoring

## Project structure

-   `contracts` - source code of all the smart contracts of the project and their dependencies.
-   `wrappers` - wrapper classes (implementing `Contract` from ton-core) for the contracts, including any [de]serialization primitives and compilation functions.
-   `tests` - tests for the contracts.
-   `scripts` - scripts used by the project, mainly the deployment scripts.

## How to use

### Build

`npx blueprint build` or `yarn blueprint build`

### Test

`npx blueprint test` or `yarn blueprint test`

### Deploy or run another script

`npx blueprint run` or `yarn blueprint run`

### Add a new contract

`npx blueprint create ContractName` or `yarn blueprint create ContractName`
