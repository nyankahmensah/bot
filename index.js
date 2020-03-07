require('dotenv').config();
const
	express = require('express'),
	bodyParser = require('body-parser'),
	app = express(),
	PORT = process.env.PORT || 8000;
app.use(bodyParser.json());
app.use('/api', require('./routes'));

app.listen(PORT, () => console.log(`webhook is listening ${PORT}`));
