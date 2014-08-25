define(["Tone/core/Tone", "Tone/component/Follower", "Tone/signal/ScaleExp", "Tone/effect/Effect"], function(Tone){

	/**
	 *  @class  AutoWah connects an envelope follower to a bandpass filter.
	 *          Some inspiration from Tuna.js https://github.com/Dinahmoe/tuna
	 *
	 *  @constructor
	 *  @extends {Tone.Effect}
	 *  @param {number=} [baseFrequency=100] the frequency the filter is set 
	 *                                       to at the low point of the wah
	 *  @param {number=} [octaves=5] the number of octaves above the baseFrequency
	 *                               the filter will sweep to when fully open
	 *  @param {number=} [sensitivity=0] the decibel threshold sensitivity for 
	 *                                   the incoming signal. Normal range of -40 to 0. 
	 */
	Tone.AutoWah = function(){

		var options = this.optionsObject(arguments, ["baseFrequency", "octaves", "sensitivity"], Tone.AutoWah._defaults);
		Tone.Effect.call(this, options);

		/**
		 *  the envelope follower
		 *  @type {Tone.Follower}
		 *  @private
		 */
		this._follower = new Tone.Follower(options.follower);

		/**
		 *  scales the follower value to the frequency domain
		 *  @type {Tone}
		 *  @private
		 */
		this._sweepRange = new Tone.ScaleExp(0, 1, 0, 1, 2);

		/**
		 *  @type {number}
		 *  @private
		 */
		this._baseFrequency = options.baseFrequency;

		/**
		 *  @type {number}
		 *  @private
		 */
		this._octaves = options.octaves;

		/**
		 *  @type {BiquadFilterNode}
		 *  @private
		 */
		this._bandpass = this.context.createBiquadFilter();
		this._bandpass.type = "bandpass";
		this._bandpass.Q.value = 2;

		/**
		 *  @type {BiquadFilterNode}
		 *  @private
		 */
		this._peaking = this.context.createBiquadFilter();
		this._peaking.type = "peaking";
		this._peaking.gain.value = 20;

		//the control signal path
		this.chain(this.effectSend, this._follower, this._sweepRange);
		this._sweepRange.connect(this._bandpass.frequency);
		this._sweepRange.connect(this._peaking.frequency);
		//the filtered path
		this.chain(this.effectSend, this._bandpass, this._peaking, this.effectReturn);
		//set the initial value
		this._setSweepRange();
		this.setSensitiviy(options.sensitivity);
	};

	Tone.extend(Tone.AutoWah, Tone.Effect);

	/**
	 *  @private
	 *  @static
	 *  @type {Object}
	 */
	Tone.AutoWah._defaults = {
		"baseFrequency" : 100,
		"octaves" : 5,
		"sensitivity" : 0,
		/** attributes for the envelope follower */
		"follower" : {
			"attack" : 0.15,
			"release" : 0.5
		}
	};

	/**
	 *  set the number of octaves that the filter will sweep
	 *  @param {number} octaves the number of octaves above the base frequency the filter will sweep
	 */
	Tone.AutoWah.prototype.setOctaves = function(octaves){
		this._octaves = octaves;
		this._setSweepRange();
	};

	/**
	 *  set the number of octaves that the filter will sweep
	 *  @param {number} octaves the number of octaves above the base frequency the filter will sweep
	 */
	Tone.AutoWah.prototype.setBaseFrequency = function(baseFreq){
		this._baseFrequency = baseFreq;
		this._setSweepRange();
	};

	/**
	 *  set the sensitivity to control how responsive to the input signal
	 *  the wah is. 
	 *  
	 *  @param {number} sensitivy the sensitivity to the input signal in dB
	 */
	Tone.AutoWah.prototype.setSensitiviy = function(sensitivy){
		this._sweepRange.setInputMax(this.dbToGain(sensitivy));
	};

	/**
	 *  sets the sweep range of the scaler
	 *  @private
	 */
	Tone.AutoWah.prototype._setSweepRange = function(){
		this._sweepRange.setOutputMin(this._baseFrequency);
		this._sweepRange.setOutputMax(Math.min(this._baseFrequency * Math.pow(2, this._octaves), this.context.sampleRate / 2));
	};

	/**
	 *  set all of the parameters with an object
	 *  @param {Object} params 
	 */
	Tone.AutoWah.prototype.set = function(params){
		if (!this.isUndef(params.baseFrequency)) this.setBaseFrequency(params.baseFrequency);
		if (!this.isUndef(params.sensitivity)) this.setSensitiviy(params.sensitivity);
		if (!this.isUndef(params.octaves)) this.setOctaves(params.octaves);
		if (!this.isUndef(params.follower)) this._follower.set(params.follower);
		Tone.Effect.prototype.set.call(this, params);
	};

	/**
	 *  clean up
	 */
	Tone.AutoWah.prototype.dispose = function(){
		Tone.Effect.prototype.dispose.call(this);
		this._follower.dispose();
		this._sweepRange.dispose();
		this._bandpass.disconnect();
		this._peaking.disconnect();
		this._follower = null;
		this._sweepRange = null;
		this._bandpass = null;
		this._peaking = null;
	};

	return Tone.AutoWah;
});