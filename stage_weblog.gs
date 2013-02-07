uses
	Sqlite

init
	if !two_parameters(args)
		return
	logfile:FileStream
	if !logfile_open( args[1], out logfile )
		return
	database:Database
	if !database_open( args[2], out database )
		return
	if !table_create( database )
		return
	stmnt:Statement
	database.prepare_v2( """insert into stage_hits ( ip_address,
		http_authenticated_name,
		time,
		http_method,
		http_path,
		http_version,
		response_code,
		body_bytes,
		referring_host,
		referring_uri_path,
		user_agent
		)
		values ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )""", -1, out stmnt )
	database.exec( "BEGIN TRANSACTION" )
	logfile_line:string?
	while (logfile_line = logfile.read_line()) != null
		var hit = new log_hit( logfile_line )
		stmnt.bind_text( 1, hit.ip_address )
		if hit.http_user == "-"
			stmnt.bind_text( 2, "" )
		else
			stmnt.bind_text( 2, hit.http_user )
		time:Time = Time.gm(0)
		time.strptime( hit.time, "%d/%b/%Y:%T" )
		utc_offset : int = 0
		offset : int = 0
		while offset < hit.time.length
			if hit.time[ offset ] == '+' or hit.time[ offset ] == '-'
				utc_offset = int.parse( hit.time[offset:offset+3] ) * 3600
				utc_offset += int.parse( hit.time[offset:offset+1]+hit.time[offset+3:offset+5] ) * 60
				break
			offset++
		stmnt.bind_int64( 3, time.mktime() - utc_offset )
		stmnt.bind_text( 4, hit.request_line )
		stmnt.bind_text( 5, hit.request_line )
		stmnt.bind_text( 6, hit.request_line )
		stmnt.bind_text( 7, hit.response_code )
		stmnt.bind_text( 8, hit.body_length )
		stmnt.bind_text( 9, hit.referrer )
		stmnt.bind_text( 10, hit.referrer )
		stmnt.bind_text( 11, hit.user_agent )
		stmnt.step()
		stmnt.reset()
	database.exec( "END TRANSACTION" )

def two_parameters( args : array of string):bool
	if args.length == 3
		return true
	else
		print "** Failed **"
		print "Expected 2 parameters, but %i supplied.", args.length - 1
		print "\nstage_weblog extracts web server hits from a combined format log file\nand loads them to a staging SQLite database table."
		print "\nUsage: stage_weblog weblog_filename sqlite_database\n"
		return false

def logfile_open( filename : string, out filestream : FileStream ):bool
	filestream = FileStream.open( filename, "r" )
	if filestream != null
		return true
	else
		print "** Failed **"
		print "Unable to open log file: %s\n", filename
		return false

def database_open( filename : string, out database : Database ):bool
	if Database.open_v2( filename, out database, Sqlite.OPEN_READWRITE ) == Sqlite.OK
		return true
	else
		print "** Failed **"
		print "Unable to open SQLite database file: %s", filename 
		print "Message from SQLite: \"%s\"\n", database.errmsg()
		return false

def table_create( database: Database ):bool
	sql:string
	sql = """create table stage_hits ( ip_address varchar not null,
				http_authenticated_name varchar not null,
				time bigint not null,
				http_method varchar not null,
				http_path varchar not null,
				http_version char(3) not null,
				response_code char(3) not null,
				body_bytes int not null,
				referring_host varchar not null,
				referring_uri_path varchar not null,
				user_agent varchar not null
				);"""
	if database.exec( sql ) == Sqlite.OK
		return true
	else
		print "** Failed **"
		print "Message from SQLite: \"%s\"\n", database.errmsg()
		return false

class log_hit : Object
	enum formats
		COMBINED
	enum states
		START
		END
	prop private format : formats
	prop private logline_value : string
	prop logline : string
		get
			return logline_value
		set
			logline_value = value
	_fields : array of string[]
	prop readonly ip_address : string
		get
			return _fields[0]
	prop readonly tcp_ident : string
		get
			return _fields[1]
	prop readonly http_user : string
		get
			return _fields[2]
	prop readonly time : string
		get
			return _fields[3]
	prop readonly request_line : string
		get
			return _fields[4]
	prop readonly response_code : string
		get
			return _fields[5]
	prop readonly body_length : string
		get
			return _fields[6]
	prop readonly referrer : string
		get
			return _fields[7]
	prop readonly user_agent : string
		get
			return _fields[8]
	construct ( line : string, logformat : formats = formats.COMBINED )
		format = logformat
		if format != formats.COMBINED
			print "Can only process combined log format"
			return
		logline = line
		_fields = new array of string[10]
		end : int = 0
		start : int = 0
		field : int = 0
		state : states = states.START
		terminator : char = ' '
		while end < logline.length
			character : char = logline[end]
			if state == states.START
				case character
					when ' '
						end++
						start = end
					when '['
						end++
						start = end
						state = states.END
						terminator = ']'
					when '"'
						end++
						start = end
						state = states.END
						terminator = '"'
					default
						start = end
						end++
						state = states.END
						terminator = ' '
			else if state == states.END
				if character == terminator
					_fields[field] = logline[start:end]
					start=end
					end++
					state = states.START
					terminator = ' '
					field++
					if field > 8
						break
				else
					end++
