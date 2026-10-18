import { Dialog, Icon } from "../../app/ui/chrome";
import { restaurant } from "../../app/data/restaurant";

// The file preview deliberately has no server, credentials or network API calls.
export default function LocalAssistant() {
  return <Dialog id="assistant-dialog" label="AI menu assistant" className="assistant-dialog">
    <div className="assistant-header"><p className="eyebrow">A LITTLE HELP FROM GLOBAL HERBS</p><h2 id="assistant-dialog-title">AI menu assistant</h2><p>Local preview · AI is not connected</p></div>
    <div className="assistant-body"><h3>Explore the menu</h3><p>This local preview does not connect to an AI service. You can still explore the menu using the shortcuts below.</p>
      <div className="assistant-quick-links"><a href="/menu?q=momo">Explore mo:mo</a><a href="/menu?q=curry">Browse curries</a></div>
      <div className="assistant-links"><a href="/menu">Full menu & prices <Icon name="arrow" /></a><a href="/book">Book a table <Icon name="arrow" /></a><a href="/order">Order takeaway <Icon name="arrow" /></a><a href={restaurant.phoneHref}>Call {restaurant.phone} <Icon name="phone" /></a></div>
      <p className="small muted">For ingredients, allergies or special requests, please contact the restaurant.</p>
    </div>
  </Dialog>;
}
