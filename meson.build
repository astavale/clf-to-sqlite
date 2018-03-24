project(
	'CLF to SQLite',
	'vala',
	'c',
)

dependencies = [
	dependency( 'glib-2.0' ),
	dependency( 'gobject-2.0' ),
	dependency( 'sqlite3' ),
	dependency( 'gee-0.8' ),
]

sources = [
	'src/init.gs',
	'src/LogHit.gs',
]

executable(
	'clf-to-sqlite',
	sources: sources,
	dependencies: dependencies,
)

tests = find_program( 'run_tests' )

env = environment()
env.set( 'MESON_SOURCE_ROOT', meson.source_root() )
env.set( 'MESON_BUILD_ROOT', meson.build_root() )
test( 'Tests', tests, env: env )
