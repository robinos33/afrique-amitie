export default {
  fetch(request, env) {
    return new Response('WORKER-ALIVE-V5', { status: 200 });
  }
};
