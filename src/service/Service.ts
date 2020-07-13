
import { spawn, Thread, Worker } from "threads";
import { ProcessMethods } from "./workers/LongProcess";

class Service {

  public run() {
    console.log("Service running...");

    this.runThreads()
      .then(this.terminteProcess)
      .catch(error => {
        console.log(error);
      });
  }

  private terminteProcess() {
    process.exit(0);
  }

  private runThreads() {
    let thread1ProcessPrimes = this.runThread('Thread1', 0, 1000);
    let thread2ProcessPrimes = this.runThread('Thread2', 1000, 2000);
    let thread3ProcessPrimes = this.runThread('Thread3', 2000, 3000);

    // Wait until both threads are completed.
    return Promise.all([ thread1ProcessPrimes, thread2ProcessPrimes, thread3ProcessPrimes ]);
  }

  private runThread(name: string, startPrimeRange: number, endPrimeRange: number) {
    return new Promise(async (resolve, reject) => {
      const processWorker = await spawn<ProcessMethods>(new Worker("./workers/LongProcess"));

      // Listen for process completion
      processWorker.streamCompleted().subscribe(async completed => {
        await Thread.terminate(processWorker);
        resolve();
      });

      // Listen for process values
      processWorker.streamValues().subscribe(processValue => {
        console.log(`${name}: prime: ${processValue.prime}`);
      });

      // Listen for process logging
      processWorker.streamLogs().subscribe(log => { 
        console.log(`Log: ${name}`, log); 
      });

      // Listen for built in events
      Thread.errors(processWorker).subscribe(error => console.log(`${name}: Thread error:`, error));
      //Thread.events(processWorker).subscribe(event => console.log(`${name}: Thread event:`, event));
      
      // Start the process
      processWorker.start(startPrimeRange, endPrimeRange);
    });
  }

}

export default new Service();
