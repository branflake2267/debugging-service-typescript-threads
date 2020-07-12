import { expose } from "threads";
import { Subject, Observable } from "threads/observable";

export interface ProcessValue {
    prime: number;
}

class LongProcess {

    subjectProcessValues: Subject<ProcessValue>;
    subjectLogs: Subject<string>;
    subjectCompleted: Subject<boolean>;

    rangeStart: number;
    rangeEnd: number;
    terminateProcess: boolean = false;

    constructor() {
        this.subjectProcessValues = new Subject();
        this.subjectLogs = new Subject();
        this.subjectCompleted = new Subject();
    }

    public start(rangeStart: number, rangeEnd: number) {
        this.rangeStart = rangeStart;
        this.rangeEnd = rangeEnd;
        
        this.run();
    }

    public stop() {
        this.terminateProcess = true;
        this.subjectProcessValues.complete();
        this.subjectLogs.complete();
        this.subjectCompleted.complete();
    }

    public streamValues(): Observable<ProcessValue> {
        return Observable.from(this.subjectProcessValues)
    }

    public streamLogs(): Observable<string> {
        return Observable.from(this.subjectLogs);
    }

    public streamCompleted(): Observable<boolean> {
        return Observable.from(this.subjectCompleted);
    }

    private run() {
        this.subjectLogs.next('Started calculating primes...');

        this.calculatePrimes(this.rangeStart);
    }

    private calculatePrimes(count: number) {
        if (count > this.rangeEnd) {
            this.subjectLogs.next('Terminating, end of range...');
            this.subjectCompleted.next(true);
            return;
        }

        if (this.terminateProcess) {
            this.subjectLogs.next('Terminating, requested...');
            return;
        }

        let result = this.isPrime(count);
        if (result) {
            //this.subjectLogs.next("prime " + count);
            let processValue : ProcessValue = { prime: count };
            this.subjectProcessValues.next(processValue);
        }

        setTimeout(() => {
            this.calculatePrimes(++count);
        }, 0);
    }

    private isPrime(value: number): boolean {
        for (var i = 2; i < value; i++) {
            if (value % i === 0) {
                return false;
            }
        }
        return value > 1;
    }
}

let process: LongProcess;

const processMethods = {
    start(rangeStart: number, rangeEnd: number) {
        process.start(rangeStart, rangeEnd);
    },  

    stop() {
        process.stop();
    },

    streamValues(): Observable<ProcessValue> {
        if (process == null) {
            process = new LongProcess();
        }
        return process.streamValues();
    },

    streamLogs(): Observable<string> {
        if (process == null) {
            process = new LongProcess();
        }
        return process.streamLogs();
    },

    streamCompleted(): Observable<boolean> {
        if (process == null) {
            process = new LongProcess();
        }
        return process.streamCompleted();
    }
};

export type ProcessMethods = typeof processMethods

expose(processMethods);

