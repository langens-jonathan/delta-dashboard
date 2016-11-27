var express = require('express');
var app = express();
var http = require('http');

var deltas = []

/**
a simple helper method for doing the http posts
**/
function httpPOST(url, path, callback, port) {
  // Build the post body
    var post_data = "{\"callback\":\"" + callback + "\"}";

  // An object of options to indicate where to post to
  var post_options = {
      host: url,
      port: port,
      path: path,
      method: 'POST',
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(post_data)
      }
  };

  // Set up the request
  var post_req = http.request(post_options, function(res) {
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
          console.log('Response: ' + chunk);
      });
  });

  // post the data
  post_req.write(post_data);
  post_req.end();

}


/**
replace all function for a string because JAVASCRIPT DOES NOT HAVE THIS FEATURE???
**/
function replaceAll(str, find, replace) {
  return str.replace(new RegExp(find, 'g'), replace);
}

app.use(function(req, res, next) {
  req.rawBody = '';
  req.setEncoding('utf8');

  req.on('data', function(chunk) { 
    req.rawBody += chunk;
  });

  req.on('end', function() {
    next();
  });
});

app.get('/dashboard', function(req, res) {
    var output = "<div style=\"background-color:#666;margin:0;padding:0;\"><h1 style=\"margin:auto;color:#ddd;\">DELTA DASHBOARD</h1><table style=\"margin:auto;\">";
    
    deltas.forEach( function(delta, index)
		    {
			var potentialInserts = "?";
			var potentialDeletes = "?";
			var effectiveInserts = "?";
			var effectiveDeletes = "?";

			console.dir(delta);
			console.dir(delta.delta);

			delta.potentials.forEach(function(pb, index)
						 {
							   pb.delta.inserts.forEach(function(pi, index2)
										    {
											pi.s.value = pi.s.value.replace("<", "&lt;");
											pi.s.value = pi.s.value.replace(">", "&gt;");
											if(potentialInserts === "?")
											    potentialInserts = "GRAPH: " + pb.graph + "<table border=\"1\"></table>";
											potentialInserts = potentialInserts.slice(0, potentialInserts.length - 8);
											potentialInserts += "<tr><td>" + pi.s.value + "</td><td>" + pi.p.value + "</td><td>" + pi.o.value + "</td></tr></table>";
										    });
							   pb.delta.deletes.forEach(function(pi, index2)
										    {
											if(potentialDeletes === "?")
											    potentialDeletes = "GRAPH: " + pb.graph + "<table border=\"1\"></table>";
											potentialDeletes = potentialDeletes.slice(0, potentialDeletes.length - 8);
											potentialDeletes += "<tr><td>" + pi.s.value + "</td><td>" + pi.p.value + "</td><td>" + pi.o.value + "</td></tr></table>";
										    });
						       });

			
			delta.effectives.forEach(function(pb, index)
						       {
							   pb.delta.inserts.forEach(function(pi, index2)
										    {
											if(effectiveInserts === "?")
											    effectiveInserts = "GRAPH: " + pb.graph + "<table border=\"1\" style=\"color:#CFF;\"></table>";
											effectiveInserts = effectiveInserts.slice(0, effectiveInserts.length - 8);
											effectiveInserts += "<tr><td>" + pi.s.value + "</td><td>" + pi.p.value + "</td><td>" + pi.o.value + "</td></tr></table>";
										    });
							   pb.delta.deletes.forEach(function(pi, index2)
										    {
											if(effectiveDeletes === "?")
											    effectiveDeletes = "GRAPH: " + pb.graph + "<table border=\"1\" style=\"color:#CFF;\"></table>";
											effectiveDeletes = effectiveDeletes.slice(0, effectiveDeletes.length - 8);
											effectiveDeletes += "<tr><td>" + pi.s.value + "</td><td>" + pi.p.value.value + "</td><td>" + pi.o.value + "</td></tr></table>";
										    });
						       });
			
			output += "<tr style=\"background-color:#fff;\">";
			output += "<td>" + delta.query + "</td>";
			output += "<td><table><tr><td style=\"background-color:#9FF;\">Potential Inserts</td></tr>";
			output += "<tr><td style=\"background-color:#9FF;\">" + potentialInserts + "</td></tr>";
			output += "<tr><td style=\"background-color:#FC9;\">Potential Deletes</td></tr>";
			output += "<tr><td style=\"background-color:#FC9;\">" + potentialDeletes + "</td></tr>";
			output += "<tr><td style=\"background-color:#06C; color:#CFF;\">Effective Inserts</td></tr>";
			output += "<tr><td style=\"background-color:#06C; color:#CFF;\">" + effectiveInserts + "</td></tr>";
			output += "<tr><td style=\"background-color:#900; color:#FCC;\">Effective Deletes</td></tr>";
			output += "<tr><td style=\"background-color:#900; color:#FCC;\">" + effectiveDeletes + "</td></tr></table></td></tr>";
		    });

    output += "</table></div>";
    
    res.send(output);
});

app.post('/effectives', function(req, res) {
    var rawBody = req.rawBody;

    rawBody = replaceAll(rawBody, "\"\"", "\"");
    
    var JSONbody = JSON.parse(rawBody);

    JSONbody.query = decodeURIComponent(JSONbody.query).toString("utf8");
    JSONbody.query = replaceAll(JSONbody.query, "<", "&lt;");
    JSONbody.query = replaceAll(JSONbody.query, ">", "&gt;");

    while(JSONbody.query.indexOf("+") > -1)
    {
	JSONbody.query = JSONbody.query.replace("+", " ");
    }
    while(JSONbody.query.indexOf("\n") > -1)
    {
	JSONbody.query = JSONbody.query.replace("\n", "<br>");
    }

    var delta = {
    	"query" : JSONbody.query,
    	"potentials": [],
    	"effectives": JSONbody.delta,
	"potentialsSet": false,
	"effectivesSet": true,
    };

    if(deltas.length > 0)
    {
	var delta0 = deltas[0];
	if(delta0.query === JSONbody.query && delta0.effectivesSet === false)
	{
	    delta = delta0;
	    delta.effectives = JSONbody.delta;
	    delta.effectivesSet = true;
	}
	else
	{
	    deltas.unshift(delta);
	}
    }
    else
    {
	deltas.unshift(delta);
    }
    
    res.send("HTTP/1.0 200 OK");
});

app.post('/potentials', function(req, res) {
    var rawBody = req.rawBody;

    rawBody = replaceAll(rawBody, "\"\"", "\"");

    console.log(req.rawBody);

    console.log(rawBody);
    
    var JSONbody = JSON.parse(rawBody);

    JSONbody.query = decodeURIComponent(JSONbody.query);
    JSONbody.query = replaceAll(JSONbody.query, "<", "&lt;");
    JSONbody.query = replaceAll(JSONbody.query, ">", "&gt;");

    
    while(JSONbody.query.indexOf("+") > -1)
    {
	JSONbody.query = JSONbody.query.replace("+", " ");
    }
    while(JSONbody.query.indexOf("\n") > -1)
    {
	JSONbody.query = JSONbody.query.replace("\n", "<br>");
    }

    var delta = {
    	"query" : JSONbody.query,
    	"effectives": [],
    	"potentials": JSONbody.delta,
	"potentialsSet": true,
	"effectivesSet": false,
    };

    if(deltas.length > 0)
    {
	var delta0 = deltas[0];
	if(delta0.query === JSONbody.query && delta0.potentialsSet === false)
	{
	    delta = delta0;
	    delta.potentials = JSONbody.delta;
	    delta.potentialsSet = true;
	}
	else
	{
	    deltas.unshift(delta);
	}
    }
    else
    {
	deltas.unshift(delta);
    }
    
    res.send("HTTP/1.0 200 OK");
});
    

app.post('/print', function (req, res) {
    console.dir(req.rawBody);
    res.send("HTTP/1.0 200 OK");
});

app.get('/clear', function (req, res) {
    deltas = [];
    res.send("HTTP/1.0 200 OK");
});

// UNCOMMENT THIS BLOCK WHEN RUNNING IN A DOCKER SET UP, IT SHOULD MAKE SURE THAT THE
// DELTA DASHBOARD CORRECTLY REGISTERS WITH THE DELTA SERVICE
/* 
function registerFunction()
{
    // httpPOST(url, path, callback, port)
    httpPOST(database, "/registerForPotentialChanges", "http://delta-dashboard/potentials", "8890");
    httpPOST(database, "/registerForPotentialChanges", "http://delta-dashboard/print", "8890");
    httpPOST(database, "/registerForEffectiveChanges", "http://delta-dashboard/effectives", "8890");
    httpPOST(database, "/registerForEffectiveChanges", "http://delta-dashboard/print", "8890");
}

setTimeout(registerFunction, 3000);*/

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
