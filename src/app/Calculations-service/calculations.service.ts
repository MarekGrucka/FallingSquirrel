import { Injectable, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { OutputData } from '../OutputData';
import { timer } from 'rxjs';
import { take } from 'rxjs/operators';

const lapseRate = -0.0065; // kelvin per m at 0 m
const universalGasConstant = 8.3144598; // J/(mol*K)
const gravitationalAcceleration = 9.80665;
const molarMassOfAir = 0.0289644; // kg/mol
const specificGasConstantForAir = 280//287.058; // J/kg*K
const eulerConstant = 2.71828;

const TroposphereMaxAltitude = 11000;
const TropopauseMaxAltitude = 20000;
const LowerStratosphereMaxAltitude = 32000;
const HigherStratosphereMaxAltitude = 47000;
const StratopauseMaxAltitude = 51000;
const LowerMesosphereMaxAltitude = 71000;
const HigherMesosphereMaxAltitude = 84000;
const atmosphericPressureAtSeaLevel = 101325;

/*
https://journals.le.ac.uk/ojs1/index.php/pst/article/download/3681/3195
Journal of Physics Special Topics
A3 6 Flying Squirrels: Falling at Terminal Velocity
*/
const squirrelTerminalVelocity = 16; // in m/s at normal conditions
const squirrelHeight = 0.42; // in meters
const squirrelWidth = 0.06;
const squirrelCrossArea = 0.024; // in m2 for 0.4 kg squirrel
const squirrelMass = 0.4; // in kg
const squirrelCoefficientOfDrag = 0.98;
const squirrelTotalArea = 0.5; // ????

/*
Convective and radiative heat transfer coefficients for individual human body segments
https://pubmed.ncbi.nlm.nih.gov/9195861/
*/
const radiativeHeatTransferCoefficientForHuman = 4.7; // W/m2 per K
const naturalConvectionHeatTransferCoefficientForHuman = 3.3 // W/m2 per K


/*
Energy metabolism of the eastern gray squirrel
https://www.jstor.org/stable/3799379
*/
const squirrelMetabolismRate = 3.5; // 3.5 kcal/g/day
const squirrelBodyTemperature = 38;
const bodyDensityOfSquirrel = 1.05; // g/ml based on human body density, as result should be very similar. Method used because lack of scientific data on squirrels (it should be good approximation for any mammal) https://pubmed.ncbi.nlm.nih.gov/931840/
const squirrelHeatCapacity = 3470; // J/kg (approx based on human body) https://pubmed.ncbi.nlm.nih.gov/7778459/#:~:text=The%20specific%20heat%20capacity%20of,on%20the%20body%20fat%20content.
// https://en.wikipedia.org/wiki/Eastern_gray_squirrel
const squirrelLenght = 0.3; // in m
const sqirrelThickness = 0.07; // in m based of side photo https://i.pinimg.com/originals/42/85/96/428596fd2307098ecc21c0cb33814f8c.jpg
const adiabaticConstant = 1.4;

@Injectable({
  providedIn: 'root'
})
export class CalculationsService {

  timeMultiplier = 1;

  outputChanged = new Subject<OutputData>();

  constructor() { }

  simulationInProgress = false;

  //speed = 12000;
  speed = 0;
  altitude = 1000000; // in meters
  temperatureInCelciusAtSeaLevel= 20;
  temperatureInKalvinAtSeaLevel= this.temperatureInCelciusAtSeaLevel+273;
  referencePressure = 101325; // in Pa
  gravitationalAcceleration = gravitationalAcceleration;
  squirrelCoefficientOfDrag = squirrelCoefficientOfDrag;
  squirrelMass = squirrelMass;
  airDrag = 0; // in newtons
  squirrelCoefficientOfArea = 0.07;
  squirrelCrossArea = Math.pow(Math.pow(this.squirrelMass, 0.2), 2) * this.squirrelCoefficientOfArea;
  squirrelVolume = (this.squirrelMass/bodyDensityOfSquirrel) * 1000; // in cm3
  squirrelTemperature = 38 + 273;
  squirrelLenght = squirrelLenght;
  squirrelBodyArea = Math.sqrt(((this.squirrelLenght*100) * this.squirrelMass) / 3600)// Mosteller equation (result in m2) // recalculate after setup; zrob dla wszystkich zmiennych

  time = 0; // in s
  actualPressure = 0;
  densityOfAir = 0;
  temperature = 0; // in K

  heatTransferCoefficient = 0; // h = C(ho+ha) where C is transformation value (1.15 for turbulent flow), ho is heat transfer coefficient for a plate at zero angle of attack and ha is htc caused by angle of attack and wedge or cone angles.


public async onStartSimulation()
{
  this.time = 0;
  this.squirrelCrossArea = Math.pow(Math.pow(this.squirrelMass, 0.2), 2) * this.squirrelCoefficientOfArea;
  this.squirrelLenght = Math.pow(this.squirrelMass, 0.333)*0.4;
  this.squirrelVolume = (this.squirrelMass/bodyDensityOfSquirrel) * 1000; // in cm3
  this.squirrelBodyArea = Math.sqrt(((this.squirrelLenght*100) * this.squirrelMass) / 3600);
  this.temperatureInKalvinAtSeaLevel= this.temperatureInCelciusAtSeaLevel+273;
  while (this.altitude > 0)
  {
    await timer(1/this.timeMultiplier*1000).pipe(take(1)).toPromise(); // tutaj dodaj time multiplier
    this.CalculateDrop(1);
    this.outputChanged.next(new OutputData(this.time, this.speed, this.altitude, this.actualPressure, this.densityOfAir, this.temperature, this.squirrelTemperature, false));
  }
  this.outputChanged.next(new OutputData(this.time, this.speed, this.altitude, this.actualPressure, this.densityOfAir, this.temperature, this.squirrelTemperature, true));
}


//https://www.grc.nasa.gov/www/k-12/airplane/sound.html
public CalculateSpeedOfSound(temperature:number, densityOfAir:number)
{
  let coefficientOfStiffness = adiabaticConstant * universalGasConstant * temperature;
  return Math.pow((coefficientOfStiffness / densityOfAir), 0.5);
}

public CalculateCoefficientOfWaveDrag(mach:number)
{
  if(mach < 1)
  {
    return 0;
  }

  return 4*(Math.pow(0, 2) + Math.pow((sqirrelThickness/squirrelLenght), 2)) / Math.pow((Math.pow(mach, 2) - 1), 0.5);
}

// returns heat in Jules
public CalculateDragHeating(time:number, oldSpeed:number, actualSpeed:number){
  let thermalCoefficient = 0.5;//1;//0.7; // based on Prandtl constant for air flow.
  let potentialSpeed = time*gravitationalAcceleration+oldSpeed;
  let speedDelta = potentialSpeed - actualSpeed; //this potential energy is converted into heat and turbulent air flow

  let dicipatedEnergy = (0.5 * this.squirrelMass * Math.pow(speedDelta, 2)) * thermalCoefficient; // in J
  return dicipatedEnergy;
}

public CalculateConvectionHeatTransfer(time:number)
{
  let heatTranferCoefficient = this.actualPressure / atmosphericPressureAtSeaLevel; // related to air pressure, as provided data was for normal enviroment
  let temperatureDelta = this.temperature - this.squirrelTemperature;
  let heatInWattsPerHour =  heatTranferCoefficient * ((naturalConvectionHeatTransferCoefficientForHuman * this.squirrelBodyArea * temperatureDelta) / (3600/time)); // time in seconds
  return heatInWattsPerHour * 3600; // convert Wh to Jules
}

public CalculateRadiativeHeatTransfer(time:number)
{
  let coefficientOfRadiation = this.squirrelTemperature / 311; //radiativeHeatTransferCoefficientForHuman is for normal body temperature. Coefficient needs to be corrected due to body temperature change (for 38 C is 1)
  let heatInWattsPerHour =  -(radiativeHeatTransferCoefficientForHuman * this.squirrelBodyArea * coefficientOfRadiation) / (3600/time); // time in seconds
  return heatInWattsPerHour * 3600; // convert Wh to Jules
}


public CalculateSquirrelTemperature(heatFromDrag:number, heatConvectionalTransfer:number, heatRadiativeTransfer:number)
{
  let totalHeatFlux = heatFromDrag + heatConvectionalTransfer + heatRadiativeTransfer;
  let temperatureChange = totalHeatFlux / (this.squirrelVolume*squirrelHeatCapacity/1000);
  return this.squirrelTemperature + temperatureChange;
}

  public CalculateDrop(time:number) // time in seconds
  {
    let oldSpeed = this.speed;
    this.temperature = this.temperatureInKalvinAtSeaLevel + (this.GetAvarageLapseRate(this.altitude) * this.altitude) <= 0 ? 0.1 : this.temperatureInKalvinAtSeaLevel + (this.GetAvarageLapseRate(this.altitude) * this.altitude);
    this.actualPressure = this.CalculateAirPressure(this.altitude, this.temperatureInKalvinAtSeaLevel, this.referencePressure)
    this.CalculateDensityOfAir();
    this.speed = this.CalculateSpeed(this.speed, time)
    let avgSpeed = (oldSpeed + this.speed) / 2;
    this.altitude = this.altitude - (avgSpeed * time) < 0 ? 0 : this.altitude - (avgSpeed * time);

    let heatFromDrag = this.CalculateDragHeating(time, oldSpeed, this.speed);
    let heatConvectionalTransfer = this.CalculateConvectionHeatTransfer(time);
    let heatRadiativeTransfer = this.CalculateRadiativeHeatTransfer(time);
    this.squirrelTemperature = this.CalculateSquirrelTemperature(heatFromDrag, heatConvectionalTransfer, heatRadiativeTransfer);

    this.time += time;
  }

  public CalculateNetForce(dragForce:number, gravitationalAcceleration:number, squirrelMass:number)
  {
    let fallingForce = gravitationalAcceleration*squirrelMass;
    return (fallingForce-dragForce) / squirrelMass;
  }

  public CalculateSpeed(initialSpeed:number, time:number)
  {
    let dragForInitialSpeed = this.CalculateTotalAirDrag(initialSpeed, this.densityOfAir);
    let speedWithInitialDrag = this.CalculateNetForce(dragForInitialSpeed, this.gravitationalAcceleration, this.squirrelMass) * time + initialSpeed;
    let dragForFinalSpeed = this.CalculateTotalAirDrag(speedWithInitialDrag, this.densityOfAir);
    let avgDrag = dragForInitialSpeed + (dragForFinalSpeed - dragForInitialSpeed) / eulerConstant;
    return this.CalculateNetForce(avgDrag, this.gravitationalAcceleration, this.squirrelMass) * time + initialSpeed;
  }

  public CalculateDensityOfAir ()
  {
    this.densityOfAir = this.actualPressure/ (specificGasConstantForAir * this.temperature);
  }

  public CalculateTotalAirDrag(speed: number, densityOfAir: number): number
  {
    let mach = this.speed / this.CalculateSpeedOfSound(this.temperature, this.densityOfAir);
    let coefficientOfWaveDrag = this. CalculateCoefficientOfWaveDrag(mach);
    let drag = this.CalculateAirDrag(speed, densityOfAir, this.squirrelCoefficientOfDrag);
    let waveDrag = this.CalculateAirDrag(speed, densityOfAir, coefficientOfWaveDrag);
    return drag+waveDrag;
  }


  public CalculateAirDrag(speed: number, densityOfAir: number, coefficientOfDrag: number): number
  {
    let power = Math.pow(speed, 2)
    let drag = 0.5 * densityOfAir * power * this.squirrelCrossArea * coefficientOfDrag;
    return drag;
  }

// raczej calculate heat transfer
  public CalculateSelfCooling(squirrelTemperature: number, airTemperature: number, heatTransferSurface: number): number
  {
      var convectionalHeatTransfer = naturalConvectionHeatTransferCoefficientForHuman * heatTransferSurface * (squirrelTemperature - airTemperature);
      var radiativeHeatTransfer = radiativeHeatTransferCoefficientForHuman * heatTransferSurface;
      return convectionalHeatTransfer + radiativeHeatTransfer;
  }

  public ShareFactor(atmosphericLayerAltitudeLowerBoundary:number, atmosphericLayerAltitudeHigherBoundary:number, altitude:number)
  {
    if (altitude < atmosphericLayerAltitudeLowerBoundary)
    {
      return 0;
    }

    if(altitude > atmosphericLayerAltitudeHigherBoundary)
    {
      return 1;
    }
    else
    {
      return (altitude - atmosphericLayerAltitudeLowerBoundary) / (atmosphericLayerAltitudeHigherBoundary-atmosphericLayerAltitudeLowerBoundary);
    }
  }


  public GetAvarageLapseRate(altitude:number)
  {
    let TroposphereWeight = TroposphereMaxAltitude*(this.ShareFactor(0, TroposphereMaxAltitude, altitude));
    let TroposphereWeightedAvg = -0.007*TroposphereWeight;

    let TropopauseWeight = (TropopauseMaxAltitude-TroposphereMaxAltitude)*(this.ShareFactor(TroposphereMaxAltitude, TropopauseMaxAltitude, altitude));
    let TropopauseWeightedAvg = -0.00001*TropopauseWeight; // non zero to make temperature appear non constatnt on this altitude- just for visual purpose (change later to some random fluctuations)

    let LowerStratosphereWeight = (LowerStratosphereMaxAltitude-TropopauseMaxAltitude)*(this.ShareFactor(TropopauseMaxAltitude, LowerStratosphereMaxAltitude, altitude));
    let LowerStratosphereWeightedAvg = 0.001*LowerStratosphereWeight;

    let HigherStratosphereWeight = (HigherStratosphereMaxAltitude-LowerStratosphereMaxAltitude)*(this.ShareFactor(LowerStratosphereMaxAltitude, HigherStratosphereMaxAltitude, altitude));
    let HigherStratosphereWeightedAvg = 0.0028*HigherStratosphereWeight;
    
    let StratopauseWeight = (StratopauseMaxAltitude-HigherStratosphereMaxAltitude)*(this.ShareFactor(HigherStratosphereMaxAltitude, StratopauseMaxAltitude, altitude));
    let StratopauseWeightedAvg = 0.00001*StratopauseWeight; // non zero to make temperature appear non constatnt on this altitude- just for visual purpose (change later to some random fluctuations)

    let LowerMesosphereWeight = (LowerMesosphereMaxAltitude-StratopauseMaxAltitude)*(this.ShareFactor(StratopauseMaxAltitude, LowerMesosphereMaxAltitude, altitude));
    let LowerMesosphereWeightedAvg = -0.0028*LowerMesosphereWeight;
    
    let HigherMesosphereWeight = (HigherMesosphereMaxAltitude-LowerMesosphereMaxAltitude)*(this.ShareFactor(LowerMesosphereMaxAltitude, HigherMesosphereMaxAltitude, altitude));
    let HigherMesosphereWeightedAvg = -0.002*HigherMesosphereWeight;

    return (TroposphereWeightedAvg+TropopauseWeightedAvg+LowerStratosphereWeightedAvg+HigherStratosphereWeightedAvg+StratopauseWeightedAvg+LowerMesosphereWeightedAvg+HigherMesosphereWeightedAvg)/(TroposphereWeight+TropopauseWeight+LowerStratosphereWeight+HigherStratosphereWeight+StratopauseWeight+LowerMesosphereWeight+HigherMesosphereWeight)

  }

  public GetLapseRate(altitude:number)
  {
    if (altitude < TroposphereMaxAltitude)
    {
      return -0.007;
    }
    if (altitude < TropopauseMaxAltitude)
    {
      return -0.0001;
    }
    if (altitude < LowerStratosphereMaxAltitude)
    {
      return +0.001;
    }
    if (altitude < HigherStratosphereMaxAltitude)
    {
      return +0.0028;
    }
    if (altitude < StratopauseMaxAltitude)
    {
      return 0.0001;
    }
    if (altitude < LowerMesosphereMaxAltitude)
    {
      return -0.0028;
    }
    if (altitude < HigherMesosphereMaxAltitude)
    {
      return -0.002;
    }
  }

  public CalculateAirPressure(altitude: number, temperatureAtSeaLevel: number, referencePressure: number): number
  {
      var base = (this.temperature) / (temperatureAtSeaLevel);
      var exponent = (-this.gravitationalAcceleration * molarMassOfAir) / (universalGasConstant * this.GetAvarageLapseRate(altitude));
      var result = referencePressure * Math.pow(base, exponent); // in Pa
      return result > 0.01 ? result : 0;
  }
}
