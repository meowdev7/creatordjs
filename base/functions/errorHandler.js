module.exports = { 
    errorHandler: function(error) {
    console.error(chalk.hex('#ff0000')(`[creatordjs v${packageJson.version}]`) + ' ❌ An error occurred:', error);
}
}