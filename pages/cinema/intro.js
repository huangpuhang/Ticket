var app = getApp();
app.MoviePage({
    data: {
        movie: {}
    },
    onLoad: function(e) {
        this.movieId = e.movieId;
        this.getMovieDetail();
    },
    getMovieDetail: function() {
        var that = this,
            movies = wx.getStorageSync('movies'),
            movie = {};
        movies.map(function(item) {
            if (that.movieId == item.movieno) {
                movie = item;
                return;
            }
        })

        if (Object.keys(movie) == 0) {
            that.requestMovieDetail();
            return;
        }

        movie.tags = movie.tags.replace(/片/g, '');
        movie.tags = movie.tags.split('/').join(',');
        movie.version = movie.version.split('/').slice(0, 2);
        console.log('movie', movie);
        that.setData({ movie: movie });
    },
    requestMovieDetail: function () {
        var that = this;
        app.request().get('/movie/movieDetail').query({ movie_no: that.movieId }).end().then(function (res) {
            var movie = res.body;
            movie.tags = movie.tags.replace(/片/g, '');
            movie.tags = movie.tags.split('/').join(',');
            movie.version = movie.version.split('/').slice(0, 2);
            that.setData({ movie: movie });
        })
    },
    tapNavToCinemas: function () {
        wx.navigateTo({
            url: '../cinema/movie?movieId=' + this.movieId
        })
    }
})