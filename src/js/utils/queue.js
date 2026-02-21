export default function Queue() {
    const elements = {};
    let head = 0;
    let tail = 0;

    function enqueue(element) {
        elements[tail] = element;
        tail++;
    }
    function dequeue() {
        const item = elements[head];
        // delete elements[head];
        head++;
        return item;
    }
    function peek() {
        return elements[head];
    }
    function length() {
        return tail - head;
    }
    function isEmpty() {
        return length() === 0;
    }

    return {enqueue, dequeue, peek, length, isEmpty};
}
