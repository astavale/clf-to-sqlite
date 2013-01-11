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
				time int not null,
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
