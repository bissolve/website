require 'webrick'

root = File.expand_path('/Users/niyasbasheer/Downloads/bissolves_model')
server = WEBrick::HTTPServer.new(
  Port: 8080,
  DocumentRoot: root
)

trap('INT') { server.shutdown }
server.start
