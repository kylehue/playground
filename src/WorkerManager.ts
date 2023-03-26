import { nanoid } from "nanoid";
import { isEqual } from "lodash-es";
interface QueueMessage {
   id: string;
   name: string;
   data: any;
   resolveFn: (value: any) => void;
}

interface WorkerMessage extends Omit<QueueMessage, "resolveFn"> {
   error?: any;
}

export class WorkerClient {
   private _queue: QueueMessage[];
   constructor(public worker: Worker) {
      this.worker.onmessage = (event) => {
         let workerMessage: WorkerMessage = event.data;

         for (let i = 0; i < this._queue.length; i++) {
            let currentQueue = this._queue[i];

            if (currentQueue.id === workerMessage.id) {
               let source = currentQueue;
               if (workerMessage.error) {
                  workerMessage.data = {
                     _error: workerMessage.error
                  };

                  console.error(workerMessage.error);
               }
               source.resolveFn(workerMessage.data);
               
               // Remove the current one in list
               this._queue.splice(i, 1);

               // Proceed to next queue
               if (this._queue.length >= 1) {
                  let nextQueue = this._queue[0];
                  let nextMesage: WorkerMessage = {
                     id: nextQueue.id,
                     name: nextQueue.name,
                     data: nextQueue.data,
                  };

                  this.worker.postMessage(nextMesage);
               }

               break;
            }
         }
      };

      this._queue = [];
   }

   async send(name: string, data: any, async = false): Promise<any> {
      return new Promise((resolveFn) => {
         let queueMessage: QueueMessage = {
            id: nanoid(),
            name,
            data,
            resolveFn,
         };

         // Add a mechanism to remove duplicates
         this._queue = this._queue.filter((queue) => {
            return queue.name !== name && !isEqual(queue.data, data);
         });

         this._queue.push(queueMessage);

         if (this._queue.length == 1 || async) {
            let workerMessage: WorkerMessage = {
               id: queueMessage.id,
               name: queueMessage.name,
               data: queueMessage.data,
            };

            this.worker.postMessage(workerMessage);
         }
      });
   }
}

type MessageCallback = (event: any) => void;
type ListenerCallback = (data: any) => any;

export class WorkerThread {
   private _onMessageCallbacks: MessageCallback[] = [];
   private _listeners = new Map<string, ListenerCallback[]>();
   constructor() {
      self.onmessage = async (event) => {
         for (let cb of this._onMessageCallbacks) {
            cb(event);
         }

         let message: WorkerMessage = event.data;
         let listeners = this._listeners.get(message.name);
         if (listeners) {
            for (let cb of listeners) {
               let result;
               try {
                  result = await cb(message.data);
               } catch (error) {
                  message.error = error;
               }

               self.postMessage({
                  id: message.id,
                  name: message.name,
                  data: result,
                  error: message.error
               } as WorkerMessage);
            }
         }
      };
   }

   onMessage(callback: MessageCallback) {
      this._onMessageCallbacks.push(callback);
   }

   listen(name: string, callback: ListenerCallback) {
      let listenersArray = this._listeners.get(name);

      if (!listenersArray) {
         listenersArray = [];
         this._listeners.set(name, listenersArray);
      }

      listenersArray.push(callback);
   }
}
