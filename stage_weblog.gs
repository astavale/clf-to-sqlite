
init
	if !two_parameters(args)
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
