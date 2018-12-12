## `clf-to-sqlite` - Load Combined Log Format Web Logs into SQLite

`clf-to-sqlite` is a command line program to extract entries from [Combined Log Format](http://httpd.apache.org/docs/current/logs.html#combined) website access logs and load the parsed lines into an SQLite database. Combined log format is the default format for Apache and NGINX access logs.</p>

The program is written in [Genie](https://wiki.gnome.org/Projects/Genie/) for performance. The program will typically extract, parse and load 300,000 log entries into an SQLite database in ~7 seconds on a 2.5GHz CPU and an SSD with sequential write speed of ~250MB/s. The program runs in a single thread.

The SQLite database can be used to run analysis queries against the web access data. More details on the program and the database schema are in the [notes](docs/notes.html).
