const uncaughtException = (err) => {
    console.log(err.name, err.message);

    console.log('UNHANDLED EXCEPTION! 💥 Shutting down...');
    process.exit(1);
};

module.exports = uncaughtException;
