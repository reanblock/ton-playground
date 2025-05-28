import "@stdlib/deploy";

message Add {
    queryId: Int as uint64;
    amount: Int as uint32;
}

contract SimpleCounterTact with Deployable {
    id: Int as uint32;
    counter: Int as uint32;

    init(id: Int) {
        self.id = id;
        self.counter = 0;
    }

    // try removing the line that increments the counter - the tests still pass until the contract is recompiled!
    receive(msg: Add) {
        // self.counter += msg.amount;

        // Notify the caller that the receiver was executed and forward remaining value back
        self.notify("Cashback".asComment());
    }

    get fun counter(): Int {
        return self.counter;
    }

    get fun id(): Int {
        return self.id;
    }
}
