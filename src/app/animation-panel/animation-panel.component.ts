
import { Component, OnInit, Input, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { CalculationsService } from '../Calculations-service/calculations.service';
import { OutputData } from '../OutputData';

type Color = 
{
  red: number;
  green: number;
  blue: number;
};

@Component({
  selector: 'app-animation-panel',
  templateUrl: './animation-panel.component.html',
  styleUrls: ['./animation-panel.component.css']
})
export class AnimationPanelComponent implements OnInit {

  time = '';
  altitude = '';
  speed = '';
  actualPressure = '';
  densityOfAir = '';
  temperature = '';
  squirrelTemperature = '';
  simulationInProgress:false;

  private _timeMultiplier = 1;

  @Input()
  get timeMultiplier():number {return this._timeMultiplier;}
  set timeMultiplier(timeMultiplier: number) {
    this._timeMultiplier = timeMultiplier;
    this.timeMultiplierChanged.next(timeMultiplier);
  }

  timeMultiplierChanged = new Subject<number>();




  constructor(private calculationsService: CalculationsService) { }

  topColor = "#090f1d";
  bottomColor = "#292952";
  bottomColor2 = "#fafafa";

  highestTopColor: Color = {red: 0, green: 0, blue: 0};
  lowestTopColor: Color = {red: 102, green: 140, blue: 255};

  highestBottomColor: Color = {red: 0, green: 0, blue: 0};
  lowestBottomColor: Color = {red: 200, green: 240, blue: 240};

  calculateSkyColors(altitude:number)
  {
    this.topColor = "";
    this.bottomColor = "";
  }


  buildHexColorCode(color: Color)
  {
    if (color.red > 255 || color.red < 0 || color.green > 255 || color.green < 0 || color.blue > 255 || color.blue < 0)
    {
    throw new Error("Color Value Out of Bounds")
    }

    return "#" + color.red.toString(16) + color.green.toString(16) + color.blue.toString(16);
  }


  ngOnInit(): void {
    this.timeMultiplierChanged.subscribe(
      (timeMultiplier: number) => {
        this.calculationsService.timeMultiplier = timeMultiplier;
      }
    )

    this.calculationsService.outputChanged.subscribe(
      (output: OutputData) => {
        this.time = output.time.toFixed(2);
        this.altitude = output.altitude.toFixed(2);
        this.speed = output.speed.toFixed(2);
        this.actualPressure = output.actualPressure.toFixed(2);
        this.densityOfAir = output.densityOfAir.toFixed(4);
        this.temperature = (output.temperature - 273).toFixed(4);
        this.squirrelTemperature = (output.squirrelTemperature - 273).toFixed(4);
      }
    );
  }
}
