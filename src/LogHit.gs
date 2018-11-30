class LogHit
	enum Formats
		COMBINED

	enum States
		START
		END

	prop logline:string
		get
			return _logline_value
		set
			_logline_value = value

	prop readonly domain:string
		get
			return _fields[0]
	prop readonly ip_address:string
		get
			return _fields[1]
	prop readonly tcp_ident:string
		get
			return _fields[2]
	prop readonly http_user:string
		get
			return _fields[3]
	prop readonly time:string
		get
			return _fields[4]
	prop readonly request_line:string
		get
			return _fields[5]
	prop readonly response_code:string
		get
			return _fields[6]
	prop readonly body_length:string
		get
			return _fields[7]
	prop readonly referrer:string
		get
			return _fields[8]
	prop readonly user_agent:string
		get
			return _fields[9]

	_format:Formats
	_logline_value:string
	_fields:array of string[] = new array of string[10]

	construct ( line:string, logformat:Formats = Formats.COMBINED )
		_format = logformat
		if _format != Formats.COMBINED
			print "Can only process combined log format"
			return
		logline = line
		_fields[0] = ""
		end:int = 0
		start:int = 0
		field:int = 1
		state:States = States.START
		terminator:char = ' '
		while end < logline.length
			character:char = logline[ end ]
			if state == States.START
				case character
					when ' '
						end++
						start = end
					when '['
						end++
						start = end
						state = States.END
						terminator = ']'
					when '"'
						end++
						start = end
						state = States.END
						terminator = '"'
					default
						start = end
						end++
						state = States.END
						terminator = ' '
			else if state == States.END
				if character == terminator
					_fields[ field ] = logline[ start:end ]
					start=end
					end++
					state = States.START
					terminator = ' '
					field++
					if field > 9
						break
				else
					end++
