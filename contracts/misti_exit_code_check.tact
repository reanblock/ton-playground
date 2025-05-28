import "@stdlib/deploy";

/*
    Example contract to test running Misti using a specific detector:
    https://nowarp.io/tools/misti/docs/detectors/ExitCodeUsage

    Then use this as a base to develop a custom detector!
*/
contract MistiExitCodeCheck with Deployable {
    owner: Address;

    init(owner: Address) {
        self.owner = owner;
    }

    receive("callme") {
        // Bad: exit code defined in the reserved range for Tact
        let code: Int = 128;
        nativeThrowUnless(code, sender() == self.owner);
    }
}
