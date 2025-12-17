/**
 * @Author: Travis
 * @Date: 2025-12-17 10:21:22
 * @Description: Port更新调度器
 * @LastEditTime: 2025-12-10 10:21:22
 * @LastEditors: Travis
 */

import { Port } from "../model-fuc/Port";

class PortUpdateDispatcher{
  private queue = new Set<Port>();
  requestUpdate(port: Port) {
    this.queue.add(port);
  }
  flush() {
    if (this.queue.size === 0) return;
    const items = [...this.queue];
    this.queue.clear();

    const visitedParents = new Set<any>();
    const visitedPorts  = new Set<any>();

    const stack = [...items];

    while (stack.length > 0){
      const port = stack.pop()!; // 栈顶元素
      const parent = port.parent;
      if (visitedPorts.has(port)) continue;
      visitedPorts .add(parent);

      port.performFollowUpdate();

      const other = port.connected;
      if (other && !visitedPorts.has(other)) {
        stack.push(other);
      }
      if (other) {
        const parent = other.parent;
        if (!visitedParents.has(parent)) {
          visitedParents.add(parent);
          if (parent.portList) {
            for (const p of parent.portList) {
              if (!visitedPorts.has(p)) {
                stack.push(p);
              }
            }
          }
        }
      }
    }
  }
}
export const PortScheduler = new PortUpdateDispatcher();