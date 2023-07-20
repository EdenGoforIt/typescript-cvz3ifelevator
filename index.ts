enum ElevatorStatus {
  Idle,
  Running,
}

interface InternalControl {
  getCurrentStatus(): ElevatorStatus;
  getCurrentFloor(): number;
  up(callback?: () => void): Promise<void>;
  down(callback?: () => void): Promise<void>;
}

class Control implements InternalControl {
  private status: ElevatorStatus;
  private floor = 0;

  getCurrentStatus(): ElevatorStatus {
    return this.status;
  }

  getCurrentFloor(): number {
    return this.floor;
  }

  async up(callback?: () => void): Promise<void> {
    this.status = ElevatorStatus.Running;
    await this.moveElevator(1);
    this.status = ElevatorStatus.Idle;
    if (callback) {
      callback();
    }
  }

  async down(callback?: () => void): Promise<void> {
    this.status = ElevatorStatus.Running;
    await this.moveElevator(-1);
    this.status = ElevatorStatus.Idle;
    if (callback) {
      callback();
    }
  }

  private moveElevator(direction: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.floor += direction;
        console.log(`Elevator is now at floor ${this.floor}`);
        resolve();
      }, 2000);
    });
  }
}

class Elevator {
  private control = new Control();
  private queue: ElevatorRequest[] = [];

  needToGoDown(request: ElevatorRequest): boolean {
    return this.control.getCurrentFloor() > request.currentFloor;
  }

  needToGoUp(request: ElevatorRequest): boolean {
    return this.control.getCurrentFloor() < request.currentFloor;
  }

  requestElevator(request: ElevatorRequest): void {
    console.log(
      `User requested to go ${
        request.isGoingUp ? 'up' : 'down'
      } from the floor ${request.currentFloor}`
    );

    if (this.queue.length === 0) {
      this.queue.push(request);
      this.processQueue();
    } else {
      this.queue.push(request);
      console.log('Added request to the queue');
    }
  }

  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      console.log('No more reqeusts');
      return;
    }

    // highest floor has the priority
    this.queue.sort((a, b) => b.currentFloor - a.currentFloor);

    const currentRequest = this.queue[0];

    if (this.needToGoUp(currentRequest)) {
      await this.control.up(() => this.processQueue());
    } else if (this.needToGoDown(currentRequest)) {
      await this.control.down(() => this.processQueue());
    } else {
      console.log(
        `Elevator is on the requested floor ${JSON.stringify(currentRequest)}`
      );
      this.queue.shift();
      this.processQueue();
    }
  }
}

class ElevatorRequest {
  constructor(public currentFloor: number, public isGoingUp: boolean) {}
}

// one elevator reference and multiple request will use the one elevator
const elevator = new Elevator();

// User A requests to go down from floor 10, 15 and 2
// expecting goes 15, then stop at 10, then stop at 2 and go up the desired floor
const userA = new ElevatorRequest(10, false);
const userB = new ElevatorRequest(15, false);
const userC = new ElevatorRequest(2, true);
elevator.requestElevator(userA);
elevator.requestElevator(userB);
elevator.requestElevator(userC);
