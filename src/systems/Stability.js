/**
 * Ink Stability: the level's erasing budget (0-100).
 * Erasing spends it; hitting zero calls onDepleted (game over).
 */
export default class Stability {
  constructor(max = 100, onDepleted = () => {}) {
    this.max = max;
    this.value = max;
    this.onDepleted = onDepleted;
  }

  spend(amount) {
    if (this.value <= 0) return;
    this.value = Math.max(0, this.value - amount);
    if (this.value <= 0) this.onDepleted();
  }

  get ratio() { return this.value / this.max; }

  /** 0 = calm, 1 = shaky, 2 = danger */
  get danger() {
    const r = this.ratio;
    return r > 0.6 ? 0 : r > 0.3 ? 1 : 2;
  }
}
