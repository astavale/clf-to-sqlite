/*
 *   clf-to-sqlite - Import a combined log format web log in to SQLite
 *
 *   Copyright (C) 2018  Alistair Thomas <opensource @ astavale.co.uk>
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License
 *   along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

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
	database.prepare_v2( """insert into stage_hits ( domain_name,
		ip_address,
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
		values ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )""", -1, out stmnt )
	database.exec( "BEGIN TRANSACTION" )
	logfile_line:string?
	while (logfile_line = logfile.read_line()) != null
		var hit = new LogHit( logfile_line )
		stmnt.bind_text( 1, hit.domain )
		stmnt.bind_text( 2, hit.ip_address )
		if hit.http_user == "-"
			stmnt.bind_text( 3, "" )
		else
			stmnt.bind_text( 3, hit.http_user )
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
		stmnt.bind_int64( 4, time.mktime() - utc_offset )
		request_line : array of string
		request_line = hit.request_line.split( " " )
		stmnt.bind_text( 5, request_line[0] )
		stmnt.bind_text( 6, request_line[1] )
		stmnt.bind_text( 7, request_line[2][5:8] )
		stmnt.bind_text( 8, hit.response_code )
		stmnt.bind_int( 9, int.parse( hit.body_length ))
		referrer_host : string = ""
		referrer_path : string = ""
		start : int = hit.referrer.index_of( "//" )
		if start > 0
			start += 2
			end : int = hit.referrer.index_of( "/", start ) 
			referrer_host = hit.referrer[ start:end ]
			referrer_path = hit.referrer[ end:hit.referrer.length ]
		stmnt.bind_text( 10, referrer_host )
		stmnt.bind_text( 11, referrer_path )
		stmnt.bind_text( 12, hit.user_agent )
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
	if Database.open( filename, out database ) == Sqlite.OK
		return true
	else
		print "** Failed **"
		print "Unable to open SQLite database file: %s", filename 
		print "Message from SQLite: \"%s\"\n", database.errmsg()
		return false

def table_create( database: Database ):bool
	sql:string
	sql = """create table stage_hits ( domain_name varchar not null,
				ip_address varchar not null,
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
