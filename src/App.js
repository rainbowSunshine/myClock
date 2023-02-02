import React from 'react';
import './App.scss';

//the initial settings
const breakTime = 10;
const sessionTime = 30;

//Set the timeout loop with interval time
const accurateInterval = function (fn, time) {
  var cancel, nextAt, timeout, wrapper;
  
  nextAt = new Date().getTime() + time; 
  timeout = null;

  wrapper = function () {
    nextAt += time;
    //setTimeout return the id of the timer
    //Use this id with clearTimeout(id) to cancel the timer
    timeout = setTimeout(wrapper, nextAt - new Date().getTime());
    return fn();
  };

  cancel = function () {
    return clearTimeout(timeout);
  };

  timeout = setTimeout(wrapper, nextAt - new Date().getTime());

  return {
    cancel: cancel
  };
};

//Child Components, using functional component

//Return the counting down timer block
function Timer(props){
  const {alarmColor,timerType,timer} = props;
  function timerformat() {
    let minutes = Math.floor(timer / 60);
    let seconds = timer - minutes * 60;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    return minutes + ':' + seconds;
  }
  return(
    <div className="timer" style={alarmColor}>
          <div className="timer-wrapper">
            <div id="timer-label">{timerType}</div>
            <div id="time-left">{timerformat()}</div>
          </div>
        </div>
  )
}
//Return the timer control block
function TimerSetControl(props){
  const {timerControl,reset} = props;
  return(
    <div className="timer-control">
          <button id="start_stop" onClick={timerControl}>
            <i className="fa fa-play fa-2x" />
            <i className="fa fa-pause fa-2x" />
          </button>
          <button id="reset" onClick={reset}>
            <i className="fa fa-refresh fa-2x" />
          </button>
        </div>
  )
}
//Return the timer length setting block
function TimerLengthControl(props) {
  const {
    titleID, title, minID, onClick,
    lengthID, length, addID,
    handleChange} = props;

  return (
    <div className="length-control">
      <div id={titleID}>{title}</div>
      <button
        className="btn-level"
        id={minID}
        onClick={onClick}
        value="-"
      >
        <i className="fa fa-arrow-down fa-2x" />
      </button>
      <div className="btn-level" >
        <input type="number" id={lengthID} value={length} onChange={handleChange}></input>
      </div>
      <button
        className="btn-level"
        id={addID}
        onClick={onClick}
        value="+"
      >
        <i className="fa fa-arrow-up fa-2x" />
      </button>
    </div>
  );
}

//Parent Component
class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      brkLength: breakTime,
      seshLength: sessionTime,
      timerState: 'stopped',
      timerType: 'Session',
      timer: sessionTime*60,
      intervalID: '',
      alarmColor: { color: 'white' }
    };
    this.setBrkLength = this.setBrkLength.bind(this);
    this.setSeshLength = this.setSeshLength.bind(this);
    this.lengthControl = this.lengthControl.bind(this);
    this.timerControl = this.timerControl.bind(this);
    this.beginCountDown = this.beginCountDown.bind(this);
    this.decrementTimer = this.decrementTimer.bind(this);
    this.phaseControl = this.phaseControl.bind(this);
    this.warning = this.warning.bind(this);
    this.buzzer = this.buzzer.bind(this);
    this.switchTimer = this.switchTimer.bind(this);
    this.reset = this.reset.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }
  //Handle the change of timer length
  handleChange(e){
    var lengthType = e.currentTarget.id;
    var length = e.currentTarget.value;

    if (this.state.timerState === 'running') {
      return;
    }

    if(lengthType === 'break-length'){
      if(this.state.timerType === 'Session'){
        this.setState({ brkLength:length});
      }else{
        this.setState({ brkLength:length,
          timer: length *60
        });
      }
    }

    if(lengthType === 'session-length'){
      if(this.state.timerType === 'Break'){
        this.setState({ seshLength:length});
      }else{
        this.setState({ seshLength:length,
          timer: length *60
        });
      }
    }

  }
// Event handler of the click event on the + and - button
  setBrkLength(e) {
    this.lengthControl(
      'brkLength',
      e.currentTarget.value,
      this.state.brkLength,
      'Session'
    );
  }

  setSeshLength(e) {
    this.lengthControl(
      'seshLength',
      e.currentTarget.value,
      this.state.seshLength,
      'Break'
    );
  }
  lengthControl(stateToChange, sign, currentLength, timerType) {
    if (this.state.timerState === 'running') {
      return;
    }
    if (this.state.timerType === timerType) {
      if (sign === '-' && currentLength !== 1) {
        this.setState({ [stateToChange]: currentLength - 1 });
      } else if (sign === '+' && currentLength !== 60) {
        this.setState({ [stateToChange]: currentLength + 1 });
      }
    } else if (sign === '-' && currentLength !== 1) {
      this.setState({
        [stateToChange]: currentLength - 1,
        timer: currentLength * 60 - 60
      });
    } else if (sign === '+' && currentLength !== 60) {
      this.setState({
        [stateToChange]: currentLength + 1,
        timer: currentLength * 60 + 60
      });
    }
  }
//Event handler for the click event on the start_stop button
//Call the beginCountDown function to start the counting down
//Stop the counting by changing the state.intervalID
  timerControl() {
    if (this.state.timerState === 'stopped') {
      this.beginCountDown();
      this.setState({ timerState: 'running' });
    } else {
      this.setState({ timerState: 'stopped' });
      if (this.state.intervalID) {
        this.state.intervalID.cancel();
      }
    }
}
//Update the intervalID state and trigger the timeout loop
  beginCountDown() {   
    this.setState({
      intervalID: accurateInterval(() => {
        this.decrementTimer();
        this.phaseControl();
      }, 1000)
    });
  }
  decrementTimer() {
    if(this.state.timer>0) this.setState({ timer: this.state.timer - 1 });
  }
  phaseControl() {
    let timer = this.state.timer;
    this.warning(timer);
    this.buzzer(timer);

    if (timer === 0) {
      if (this.state.intervalID) {
        this.state.intervalID.cancel();
      }
      if (this.state.timerType === 'Session') {
        this.switchTimer(this.state.brkLength * 60, 'Break');
        this.beginCountDown();
      } else {
        this.beginCountDown();
        this.switchTimer(this.state.seshLength * 60, 'Session');
      }
    }
  }
  warning(_timer) {
    if (_timer < 61) {
      this.setState({ alarmColor: { color: '#a50d0d' } });
    } else {
      this.setState({ alarmColor: { color: 'white' } });
    }
  }
  buzzer(_timer) {
    if (_timer === 0) {
      this.audioBeep.play();
    }
  }
  //Update the timer and timerType
  switchTimer(num, str) {
    this.setState({
      timer: num,
      timerType: str,
      alarmColor: { color: 'white' }
    });
  }
  //Event handler for the click event on the reset button
  reset() {
    this.setState({
      brkLength: breakTime,
      seshLength: sessionTime,
      timerState: 'stopped',
      timerType: 'Session',
      timer: sessionTime*60,
      intervalID: '',
      alarmColor: { color: 'white' }
    });
    if (this.state.intervalID) {
      this.state.intervalID.cancel();
    }
    this.audioBeep.pause();
    this.audioBeep.currentTime = 0;
  }
  render() {
    return (
      <div>
        <div className="main-title">My Clock</div>
        <TimerLengthControl
          addID="break-increment"
          length={this.state.brkLength}
          lengthID="break-length"
          minID="break-decrement"
          onClick={this.setBrkLength}
          title="Break Length"
          titleID="break-label"
          handleChange={this.handleChange}
        />
        <TimerLengthControl
          addID="session-increment"
          length={this.state.seshLength}
          lengthID="session-length"
          minID="session-decrement"
          onClick={this.setSeshLength}
          title="Session Length"
          titleID="session-label"
          handleChange={this.handleChange}
        />
        <Timer
          alarmColor={this.state.alarmColor}
          timerType={this.state.timerType}
          timer={this.state.timer}
        />
        <TimerSetControl 
          timerControl={this.timerControl}
          reset = {this.reset}
        />
        <audio
          id="beep"
          preload="auto"
          ref={(audio) => {
            this.audioBeep = audio;
          }}
          src="./BeepSound.wav"
        />
      </div>
    );
  }

}

export default App;
