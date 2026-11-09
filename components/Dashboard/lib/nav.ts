// Opening one screen's details from another: a booking's details ask for its customer's
// (Customers listens and opens them; the dashboard switches to Customers).
export const OPEN_CUSTOMER = 'mt:open-customer';
let pending: string | null = null;
/** open the customer this booking belongs to */
export const openCustomerOf = (bookingId: string) => {
    pending = bookingId;
    window.dispatchEvent(new Event(OPEN_CUSTOMER));
};
/** the booking whose customer is waiting to be opened (once) */
export const takePendingCustomer = () => { const p = pending; pending = null; return p; };
