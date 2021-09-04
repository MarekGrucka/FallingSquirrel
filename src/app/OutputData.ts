export class OutputData{

    time = 0; // in s
    speed = 0;
    altitude = 0;
    actualPressure = 0;
    densityOfAir = 0;
    temperature = 0; // in K
    squirrelTemperature = 0 // in K
    simulationFinished = false;

    constructor(time:number, speed:number, altitude:number, actualPressure:number, densityOfAir:number, temperature:number, squirrelTemperature:number, simulationFinished:boolean)
    {
        this.time = time;
        this.speed = speed;
        this.altitude = altitude;
        this.actualPressure = actualPressure;
        this.densityOfAir = densityOfAir;
        this.temperature = temperature;
        this.simulationFinished = simulationFinished;
        this.squirrelTemperature = squirrelTemperature;
    }

}