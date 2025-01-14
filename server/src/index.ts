app.use(cors({
    origin: '*',
    credentials: true
}));

app.listen(5001, '0.0.0.0', () => {
    console.log('Server running on port 5001');
}); 