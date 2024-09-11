const stripe = Stripe(
    'pk_test_51PxUlGIHS2H7Cn9kkxq539jsoyBXtmNHBG93QULcqmDq51fQqHNH6210Ph0EiubAdIAG2gitpTTyqnBtRLSVMZi300gcZH7FTX'
);

const bookBtn = document.getElementById('book-tour');

if (bookBtn) {
    bookBtn.addEventListener('click', async (e) => {
        e.target.textContent = 'Processing...';

        console.log('clicked');
        const {tourId} = e.target.dataset;

        if (tourId) {
            await bookTour(tourId);
        }
    });
}

async function bookTour(tourId) {
    try {
        // 1) Get checkout session from server/API
        const response = await axios(`/api/v1/bookings/checkout-session/${tourId}`, {
            withCredentials: true,
        });
        console.log('Checkout session:', response);

        await stripe.redirectToCheckout({
            sessionId: response.data.sessionId, // Corrected here
        });
    } catch (error) {
        console.error('Error booking tour:', error);
    }
}
