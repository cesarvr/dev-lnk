
Consider the following snippet:

```cpp
struct Queen {
    int x;
    int y;

    Queen(int x, int y) : x{x}, y{y} {}

    bool performAttack(std::vector<Queen>& queens) {
        for (auto& queen : queens) {
            // Check if we are in the same Queen.
            if (queen.x == x && queen.y == y) {
                continue;
            }

            // Check if we can take vertical or horizontal.
            if (queen.x == x || queen.y == y) {
                return true;
            }

            // Check if we can take an enemy in diagonal.
            auto xx = std::abs(x - queen.x);
            auto yy = std::abs(y - queen.y);

            if ((xx - yy) == 0) return true;
        }
        return false;
    }
};
```

This code is modeling the attack behaviour of chess Queen, although it does a good job explaining its intention to the machine this code can be optimized for other people's readability, and this is an important factor when dealing with scalable code.

To improve this code I going to steal a quote from Sandy Metz book about [Pragmatic Object Oriented Design](https://www.amazon.es/Practical-Object-Oriented-Design-Ruby-Addison-Wesley-ebook/dp/B0096BYG7C/ref=sr_1_2?__mk_es_ES=%C3%85M%C3%85%C5%BD%C3%95%C3%91&dchild=1&keywords=sandi+metz&qid=1605076090&sr=8-2) that basically give us the trick we need: 			
