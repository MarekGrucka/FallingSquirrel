const lapseRate = 9.8; // 9.8 kelvin degree per km
const universalGasConstant = 8.3144598; // J/(mol*K)
const gravitationalAcceleration = 9.80665;
const molarMassOfAir = 0.0289644; // kg/mol

/*
https://journals.le.ac.uk/ojs1/index.php/pst/article/download/3681/3195
Journal of Physics Special Topics
A3 6 Flying Squirrels: Falling at Terminal Velocity
*/
const squirrelTerminalVelocity = 16; // in m/s at normal conditions
const squirrelHeight = 0.42; // in meters
const squirrelWidth = 0.06;
const squirrelCrossArea = 0.024; // in m2
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
Thermoregulation in the squirrel monkey
https://journals.physiology.org/doi/abs/10.1152/jappl.1971.31.1.48
*/


/*
Energy metabolism of the eastern gray squirrel
https://www.jstor.org/stable/3799379
*/
const squirrelMetabolismRate = 3.5; // 3.5 kcal/g/day

const squirrelBodyTemperature = 38;


class Calculation
{
    startingAltitude = 1000000; // in meters
    time = 0; // in seconds


    


    public CalculateAirDrag(densityOfAir: number, speed: number): number
    {
        return 0.5 * densityOfAir * Math.pow(speed, 2) * squirrelCoefficientOfDrag * squirrelCrossArea;
    }

    public CalculateSelfCooling(squirrelTemperature: number, airTemperature: number, heatTransferSurface: number): number
    {
        var convectionalHeatTransfer = naturalConvectionHeatTransferCoefficientForHuman * heatTransferSurface * (squirrelTemperature - airTemperature);
        var radiativeHeatTransfer = radiativeHeatTransferCoefficientForHuman * heatTransferSurface;
        return convectionalHeatTransfer + radiativeHeatTransfer;
    }

    public CalculateAirPressure(altitude: number, temperatureAtSeaLevel: number = 20, referencePressure: number = 101325): number
    {
        var base = referencePressure * ((referencePressure + lapseRate * altitude) / (universalGasConstant * temperatureAtSeaLevel));
        var exponent = (-gravitationalAcceleration * molarMassOfAir) / (universalGasConstant * lapseRate);
        return Math.pow(base, exponent); // in Pa
    }
}