require "cuba"
require 'json'
require 'imdb'
require 'wikipedia'
require 'dalli'
require 'uri'

options = { :namespace => "imdb", :compress => true }
imdb_cache = Dalli::Client.new('localhost:11211', options)
options = { :namespace => "wiki", :compress => true }
wiki_cache = Dalli::Client.new('localhost:11211', options)

Cuba.use Rack::Static,
  :urls => "/",
  :root => 'public',
  :index => 'index.html'

Cuba.use Rack::Static,
  :urls => ["/js","/css","/assets"],
  :root => 'public'

Cuba.define do
  on "api/getActors/:movieID" do |movieID|
   reply = wiki_cache.get(movieID)
   if !reply
     movie = Imdb::Movie.new(movieID)
     cast_members = movie.cast_members

     hasImage = []
     cast_members.each do |actor|
       image_urls = Wikipedia.find(actor).image_urls.select{|url|
         File.extname(url) == ".jpg"}
       if image_urls.any?
          hasImage << {:name => actor, :imgurl => image_urls[-1]}
       end
       break if hasImage.length > 4
     end

     reply = {:members => hasImage, :title => movie.title}.to_json
     wiki_cache.set(movieID, reply)
   end
    res.write "#{reply}"
 end
 
 on "api/queryMovie/:movieTitle" do |movieTitle|
   reply = imdb_cache.get(movieTitle)
   if !reply
     term =  URI.decode(movieTitle)
     movies = Imdb::Search.new(term).movies

     reply = movies[0..5].map{|movie|
       {:id => movie.id,:title => movie.title, :poster => movie.poster}
      }.to_json

      imdb_cache.set(movieTitle, reply)
    end
   res.write "#{reply}"
 end
end
