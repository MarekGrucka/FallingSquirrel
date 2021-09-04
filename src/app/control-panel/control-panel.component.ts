import { Component, Input, OnInit } from '@angular/core';
import { CalculationsService } from '../Calculations-service/calculations.service';
import { OutputData } from '../OutputData';

@Component({
  selector: 'app-control-panel',
  templateUrl: './control-panel.component.html',
  styleUrls: ['./control-panel.component.css']
})
export class ControlPanelComponent implements OnInit {

  altitude = 1000000;
  temperature = 20;
  pressure = 101325;
  gravitationalAcceleration = 9.80665;
  squirrelCoefficientOfDrag = 0.98;
  squirrelMass = 0.4;
  simulationInProgress = false;

  stateCtrl = {
    checked: true,
  };

  onStartSimulation()
  {
    this.simulationInProgress = true;
    this.SetupCalculation();
    this.calculationsService.onStartSimulation();
  }


  SetupCalculation()
  {
    this.calculationsService.altitude = this.altitude;
    this.calculationsService.temperatureInCelciusAtSeaLevel = this.temperature;
    this.calculationsService.referencePressure = this.pressure;
    this.calculationsService.gravitationalAcceleration = this.gravitationalAcceleration;
    this.calculationsService.squirrelCoefficientOfDrag = this.squirrelCoefficientOfDrag;
    this.calculationsService.squirrelMass = this.squirrelMass;
  }

  formatPressureLabel(value: number) {
    if (value >= 1000) {
      return Math.round(value / 100);
    }

    return value;
  }

  constructor(private calculationsService: CalculationsService) { }

  ngOnInit(): void {
  this.altitude = 1000000;
  this.temperature = 20;
  this.pressure = 101325;
  this.gravitationalAcceleration = 9.80665;
  this.squirrelCoefficientOfDrag = 0.98;
  this.squirrelMass = 0.4;


  this.calculationsService.outputChanged.subscribe(
    (output: OutputData) => {
      this.simulationInProgress = !output.simulationFinished;
    }
  );
  }

}
